Promise = require 'bluebird'
_ = require 'underscore'
io = require 'socket.io'
os = require 'os'
request = require 'request'
util = require 'util'

CONFIG = require '../../app/common/config'
Consul = require './consul.coffee'
EVENTS = require '../../app/common/event_types'
Logger = require '../../app/common/logger.coffee'
SDK = require '../../app/sdk.coffee'
Spectate = require './spectate.coffee'
UtilsGameSession = require '../../app/common/utils/utils_game_session.coffee'
config = require '../../config/config'
{Redis, Jobs, GameManager} = require '../redis/'

###
# must be called after game is over
# processes a game, saves to redis, and kicks-off post-game processing jobs
# @public
# @param	{String}		gameId				The game ID that is over.
# @param	{Object}		gameSession		 The game session data.
# @param	{Array}		 mouseAndUIEvents	The mouse and UI events for this game.
###
afterGameOver = (gameId, gameSession, mouseAndUIEvents) ->
	Logger.module("GAME-OVER").log "[G:#{gameId}]", "---------- ======= GAME #{gameId} OVER ======= ---------".green

	# Update User Ranking, Progression, Quests, Stats
	updateUser = (userId, opponentId, gameId, factionId, generalId, isWinner, isDraw, ticketId) ->
		Logger.module("GAME-OVER").log "[G:#{gameId}]", "UPDATING user #{userId}. (winner:#{isWinner})"
		player = gameSession.getPlayerById(userId)
		isFriendly = gameSession.isFriendly()

		# get game type for user
		gameType = gameSession.getGameType()
		if gameType == SDK.GameType.Casual and player.getIsRanked()
			# casual games should be processed as ranked for ranked players
			gameType = SDK.GameType.Ranked

		# check for isUnscored
		isUnscored = false
		# calculate based on number of resign status and number of actions
		# if the game didn't have a single turn, mark the game as unscored
		if gameSession.getPlayerById(userId).hasResigned and gameSession.getTurns().length == 0
			Logger.module("GAME-OVER").debug "[G:#{gameId}]", "User: #{userId} CONCEDED a game with 0 turns. Marking as UNSCORED".yellow
			isUnscored = true
		else if not isWinner and not isDraw
			# otherwise check how many actions the player took
			playerActionCount = 0
			meaningfulActionCount = 0
			moveActionCount = 0
			for a in gameSession.getActions()
				# explicit actions
				if a.getOwnerId() == userId && a.getIsImplicit() == false
					playerActionCount++

					# meaningful actions
					if a instanceof SDK.AttackAction
						if a.getTarget().getIsGeneral()
							meaningfulActionCount += 2
						else
							meaningfulActionCount += 1
					if a instanceof SDK.PlayCardFromHandAction or a instanceof SDK.PlaySignatureCardAction
						meaningfulActionCount += 1
					if a instanceof SDK.BonusManaAction
						meaningfulActionCount += 2

					# move actions
					if a instanceof SDK.MoveAction
						moveActionCount += 1

				# more than 9 explicit actions
				# more than 1 move action
				# more than 5 meaningful actions
				if playerActionCount > 9 and moveActionCount > 1 and meaningfulActionCount > 4
					break

			###
			what we're looking for:
			* more than 9 explicit actions
			* more than 1 move action
			* more than 5 meaningful actions
			... otherwise mark the game as unscored
			###
			# Logger.module("GAME-OVER").log "[G:#{gameId}]", "User: #{userId} #{playerActionCount}, #{moveActionCount}, #{meaningfulActionCount}".cyan
			if playerActionCount <= 9 or moveActionCount <= 1 or meaningfulActionCount <= 4
				Logger.module("GAME-OVER").debug "[G:#{gameId}]", "User: #{userId} CONCEDED a game with too few meaningful actions. Marking as UNSCORED".yellow
		# start the job to process the game for a user
		return Jobs.create("update-user-post-game",
			name: "Update User Ranking"
			title: util.format("User %s :: Game %s", userId, gameId)
			userId: userId
			opponentId: opponentId
			gameId: gameId
			gameType: gameType
			factionId: factionId
			generalId: generalId
			isWinner: isWinner
			isDraw: isDraw
			isUnscored: isUnscored
			ticketId: ticketId
		).removeOnComplete(true) # wait to save job until ready to process

	updateUsersRatings = (player1UserId, player2UserId, gameId, player1IsWinner, isDraw) ->
		# Detect if one player is casual playing in a ranked game
		player1IsRanked = gameSession.getPlayerById(player1UserId).getIsRanked()
		player2IsRanked = gameSession.getPlayerById(player2UserId).getIsRanked()
		gameType = gameSession.getGameType()
		if gameType == SDK.GameType.Casual and (player1IsRanked || player2IsRanked)
			# casual games should be processed as ranked for ranked players
			gameType = SDK.GameType.Ranked
		isRanked = gameType == SDK.GameType.Ranked
		Logger.module("GAME-OVER").debug "[G:#{gameId}]", "UPDATING users [#{player1UserId},#{player2UserId}] ratings."

		# Ratings only process in NON-FRIENDLY matches where at least 1 player is rank 0
		if isRanked
			# start the job to process the ratings for the players
			return Jobs.create("update-users-ratings",
				name: "Update User Rating"
				title: util.format("Users [%s,%s] :: Game %s", player1UserId,player2UserId, gameId)
				player1UserId: player1UserId
				player1IsRanked: player1IsRanked
				player2UserId: player2UserId
				player2IsRanked: player2IsRanked
				gameId: gameId
				player1IsWinner: player1IsWinner
				isDraw: isDraw
			).removeOnComplete(true).save()
		else
			return Promise.resolve()

	# Save then archive game session
	archiveGame = (gameId, gameSession, mouseAndUIEvents) ->
		return Promise.all([
			GameManager.saveGameMouseUIData(gameId, JSON.stringify(mouseAndUIEvents)),
			GameManager.saveGameSession(gameId, gameSession.serializeToJSON(gameSession))
		]).then () ->
			# Job: Archive Game
			Jobs.create("archive-game",
				name: "Archive Game"
				title: util.format("Archiving Game %s", gameId)
				gameId: gameId
				gameType: gameSession.getGameType()
			).removeOnComplete(true).save()

	# Builds a promise for executing the user update ratings job after player update jobs have completed
	updateUserRatingsPromise = (updatePlayer1Job,updatePlayer2Job,player1Id,player2Id,gameId,player1IsWinner,isDraw) ->
		# Wait until both players update jobs have completed before updating ratings
		return Promise.all([
			new Promise (resolve,reject) -> updatePlayer1Job.on("complete",resolve); updatePlayer1Job.on("error",reject),
			new Promise (resolve,reject) -> updatePlayer2Job.on("complete",resolve); updatePlayer2Job.on("error",reject)
		]).then () ->
			updateUsersRatings(player1Id,player2Id,gameId,player1IsWinner,isDraw)
		.catch (error) ->
			Logger.module("GAME-OVER").error "[G:#{gameId}]", "ERROR: afterGameOver update player job failed #{error}".red

	# gamesession player data
	player1Id = gameSession.getPlayer1Id()
	player2Id = gameSession.getPlayer2Id()
	player1FactionId = gameSession.getPlayer1SetupData()?.factionId
	player2FactionId = gameSession.getPlayer2SetupData()?.factionId
	player1GeneralId = gameSession.getPlayer1SetupData()?.generalId
	player2GeneralId = gameSession.getPlayer2SetupData()?.generalId
	player1TicketId = gameSession.getPlayer1SetupData()?.ticketId
	player2TicketId = gameSession.getPlayer2SetupData()?.ticketId
	winnerId = gameSession.getWinnerId()
	loserId = gameSession.getWinnerId()
	player1IsWinner = (player1Id == winnerId)
	isDraw = if !winnerId? then true else false

	# update promises
	promises = []

	# update users
	updatePlayer1Job = updateUser(player1Id,player2Id,gameId,player1FactionId,player1GeneralId,(player1Id == winnerId),isDraw,player1TicketId)
	updatePlayer2Job = updateUser(player2Id,player1Id,gameId,player2FactionId,player2GeneralId,(player2Id == winnerId),isDraw,player2TicketId)
	# wait until both players update jobs have completed before updating ratings
	promises.push(updateUserRatingsPromise(updatePlayer1Job,updatePlayer2Job,player1Id,player2Id,gameId,player1IsWinner,isDraw))
	updatePlayer1Job.save()
	updatePlayer2Job.save()

	# archive game
	promises.push(archiveGame(gameId, gameSession, mouseAndUIEvents))

	# execute promises
	Promise.all(promises)
	.then () ->
		Logger.module("GAME-OVER").debug "[G:#{gameId}]", "afterGameOver done, game is being archived".green
	.catch (error) ->
		Logger.module("GAME-OVER").error "[G:#{gameId}]", "ERROR: afterGameOver failed #{error}".red

###
# This function destroys in-memory game session of there is no one left connected
# @public
# @param	{String}	gameId		The ID of the game to destroy.
# @param	{Boolean} persist	 Do we need to save/archive this game?
###
destroyGameSessionIfNoConnectionsLeft = (gameId,persist=false)->
	if games[gameId].connectedPlayers.length == 0 and games[gameId].connectedSpectators.length == 0
		clearDisconnectedPlayerTimeout(gameId)
		stopTurnTimer(gameId)
		Spectate.tearDownSpectateSystemsIfNoSpectatorsLeft(gameId)
		Logger.module("...").debug "[G:#{gameId}]", "destroyGameSessionIfNoConnectionsLeft() -> no players left DESTROYING local game cache".red
		unsubscribeFromGameSessionEvents(gameId)

		# TEMP: a way to upload unfinished game data to AWS S3 Archive. For example: errored out games.
		if persist and games?[gameId]?.session?.status != SDK.GameStatus.over
			data = games[gameId].session.serializeToJSON(games[gameId].session)
			mouseAndUIEventsData = JSON.stringify(games[gameId].mouseAndUIEvents)
			Promise.all([
				GameManager.saveGameSession(gameId,data),
				GameManager.saveGameMouseUIData(gameId,mouseAndUIEventsData),
			])
			.then (results) ->
				Logger.module("...").debug "[G:#{gameId}]", "destroyGameSessionIfNoConnectionsLeft -> unfinished Game Archived to S3: #{results[1]}".green
			.catch (error)->
				Logger.module("...").error "[G:#{gameId}]", "destroyGameSessionIfNoConnectionsLeft -> ERROR: failed to archive unfinished game to S3 due to error #{error.message}".red

		delete games[gameId]
		saveGameCount(--gameCount)

	else
		Logger.module("...").debug "[G:#{gameId}]", "destroyGameSessionIfNoConnectionsLeft() -> players left: #{games[gameId].connectedPlayers.length} spectators left: #{games[gameId].connectedSpectators.length}"

# perform DNS health check
dnsHealthCheck = () ->
	if config.isDevelopment()
		return Promise.resolve({healthy: true})
	nodename = "#{config.get('env')}-#{os.hostname().split('.')[0]}"
	return Consul.kv.get("nodes/#{nodename}/dns_name")
	.then (dnsName) ->
		return new Promise (resolve, reject) ->
			request.get("https://#{dnsName}/health")
			.end (err, res) ->
				if err
					return resolve({dnsName: dnsName, healthy: false})
				if res? && res.status == 200
					return resolve({dnsName: dnsName, healthy: true})
				return ({dnsName: dnsName, healthy: false})
	.catch (e) ->
		return {healthy: false}

###
# start a game session if one doesn't exist and call a completion handler when done
# @public
# @param	{Object}		gameId			The game ID to load.
# @param	{Function}		onComplete		Callback when done.
###
initGameSession = (gameId,onComplete) ->
	if games[gameId]?.loadingPromise
		return games[gameId].loadingPromise

	# setup local cache reference if none already there
	if not games[gameId]
		games[gameId] =
			opponentEventDataBuffer:[]
			connectedPlayers:[]
			session:null
			connectedSpectators:[]
			spectateIsRunning:false
			spectateIsDelayed:false
			spectateDelay:30000
			spectatorGameEventBuffer:[]
			spectatorOpponentEventDataBuffer:[]
			spectatorDelayedGameSession:null
			turnTimerStartedAt: 0
			turnTimeTickAt: 0
			turnTimeRemaining: 0
			turnTimeBonus: 0

	# return game session from redis
	games[gameId].loadingPromise = Promise.all([
		GameManager.loadGameSession(gameId)
		GameManager.loadGameMouseUIData(gameId)
	])
	.spread (gameData,mouseData)->
		return [
			JSON.parse(gameData)
			JSON.parse(mouseData)
		]
	.spread (gameDataIn,mouseData) ->
		Logger.module("IO").log "[G:#{gameId}]", "initGameSession -> loaded game data for game:#{gameId}"

		# deserialize game session
		gameSession = SDK.GameSession.create()
		gameSession.setIsRunningAsAuthoritative(true)
		gameSession.deserializeSessionFromFirebase(gameDataIn)
		if gameSession.isOver()
			throw new Error("Game is already over!")

		# store session
		games[gameId].session = gameSession

		# store mouse and ui event data
		games[gameId].mouseAndUIEvents = mouseData
		saveGameCount(++gameCount)

		# in case the server restarted or loading data for first time, set the last action at timestamp for both players to now
		# this timestamp is used to shorten turn timer if player has not made any moves for a long time
		_.each(gameSession.players,(player)->
			player.setLastActionTakenAt(Date.now())
		)

		# this is ugly but a simple way to subscribe to turn change events to save the game session
		subscribeToGameSessionEvents(gameId)

		# start the turn timer
		restartTurnTimer(gameId)
		return Promise.resolve([
			games[gameId].session
		])
	.catch (error) ->
		Logger.module("IO").log "[G:#{gameId}]", "initGameSession:: error: #{JSON.stringify(error.message)}".red
		Logger.module("IO").log "[G:#{gameId}]", "initGameSession:: error stack: #{error.stack}".red
		throw error

###*
# This method is called every time a socket handler recieves a game event and is executed within the context of the socket (this == sending socket).
# @public
# @param	{Object}	eventData	 Plain JS object with event data that contains one "event".
###
onGameEvent = (eventData) ->
	# if for some reason spectator sockets start broadcasting game events
	if @.spectatorId
		Logger.module("IO").error "[G:#{@.gameId}]", "onGameEvent :: ERROR: spectator sockets can't submit game events. (type: #{eventData.type})".red
		return

	# Logger.module("IO").log "onGameEvent -> #{JSON.stringify(eventData)}".blue
	if not @gameId or not games[@gameId]
		@emit EVENTS.network_game_error,
			code:500
			message:"could not broadcast game event because you are not currently in a game"
		return

	gameSession = games[@gameId].session
	if eventData.type == EVENTS.step
		#Logger.module("IO").log "[G:#{@.gameId}]", "game_step -> #{JSON.stringify(eventData.step)}".green
		#Logger.module("IO").log "[G:#{@.gameId}]", "game_step -> #{eventData.step?.playerId} #{eventData.step?.action?.type}".green
		player = _.find(gameSession.players,(p)-> p.playerId == eventData.step?.playerId)
		player?.setLastActionTakenAt(Date.now())

		try
			step = gameSession.deserializeStepFromFirebase(eventData.step)
			action = step.action
			if action?
				# clear out any implicit actions sent over the network and re-execute this as a fresh explicit action on the server
				# the reason is that we want to re-generate and re-validate all the game logic that happens as a result of this FIRST explicit action in the step
				action.resetForAuthoritativeExecution()

				# execute the action
				gameSession.executeAction(action)
		catch error
			Logger.module("IO").error "[G:#{@.gameId}]", "onGameStep:: error: #{JSON.stringify(error.message)}".red
			Logger.module("IO").error "[G:#{@.gameId}]", "onGameStep:: error stack: #{error.stack}".red

			# delete but don't destroy game
			destroyGameSessionIfNoConnectionsLeft(@gameId,true)

			# send error to client, forcing reconnect on client side
			io.to(@gameId).emit EVENTS.network_game_error, JSON.stringify(error.message)
			return
	else
		# transmit the non-step game events to players
		# step events are emitted automatically after executed on game session
		emitGameEvent(@, @gameId, eventData)

###*
# Server side game timer. After 90 seconds it will end the turn for the current player.
# @public
# @param	{Object}		gameId			The game for which to iterate the time.
###
onGameTimeTick = (gameId) ->
	game = games[gameId]
	gameSession = game?.session
	if gameSession?
		# allowed turn time is 90 seconds + slop buffer that clients don't see
		allowed_turn_time = MAX_TURN_TIME

		# grab the current player
		player = gameSession.getCurrentPlayer()

		# if we're past the 2nd turn, we can start checking backwards to see how long the PREVIOUS turn for this player took
		if player and gameSession.getTurns().length > 2

			# find the current player's previous turn
			allTurns = gameSession.getTurns()
			playersPreviousTurn = null

			for i in [allTurns.length-1..0] by -1
				if allTurns[i].playerId == player.playerId
					playersPreviousTurn = allTurns[i] # gameSession.getTurns()[gameSession.getTurns().length - 3]
					break

			#Logger.module("IO").log "[G:#{gameId}]", "onGameTimeTick:: last action at #{player.getLastActionTakenAt()} / last turn delta #{playersPreviousTurn?.createdAt - player.getLastActionTakenAt()}".red

			# if this player's previous action was on a turn older than the last one
			if playersPreviousTurn && (playersPreviousTurn.createdAt - player.getLastActionTakenAt() > 0)
				# you're only allowed 15 seconds + 3 second buffer that clients don't see
				allowed_turn_time = MAX_TURN_TIME_INACTIVE

		lastTurnTimeTickAt = game.turnTimeTickAt
		game.turnTimeTickAt = Date.now()
		delta_turn_time_tick = game.turnTimeTickAt - lastTurnTimeTickAt
		delta_since_timer_began = game.turnTimeTickAt - game.turnTimerStartedAt
		game.turnTimeRemaining = Math.max(0.0, allowed_turn_time - delta_since_timer_began + game.turnTimeBonus)
		game.turnTimeBonus = Math.max(0.0, game.turnTimeBonus - delta_turn_time_tick)
		#Logger.module("IO").log "[G:#{gameId}]", "onGameTimeTick:: delta #{delta_turn_time_tick/1000}, #{game.turnTimeRemaining/1000} time remaining, #{game.turnTimeBonus/1000} bonus remaining"

		turnTimeRemainingInSeconds = Math.ceil(game.turnTimeRemaining/1000)
		gameSession.setTurnTimeRemaining(turnTimeRemainingInSeconds)

		if game.turnTimeRemaining <= 0
			# turn time has expired
			stopTurnTimer(gameId)

			if gameSession.status == SDK.GameStatus.new
				# force draw starting hand with current cards
				for player in gameSession.players
					if not player.getHasStartingHand()
						Logger.module("IO").log "[G:#{gameId}]", "onGameTimeTick:: mulligan timer up, submitting player #{player.playerId.blue} mulligan".red
						drawStartingHandAction = player.actionDrawStartingHand([])
						gameSession.executeAction(drawStartingHandAction)
			else if gameSession.status == SDK.GameStatus.active
				# force end turn
				Logger.module("IO").log "[G:#{gameId}]", "onGameTimeTick:: turn timer up, submitting player #{gameSession.getCurrentPlayerId().blue} turn".red
				endTurnAction = gameSession.actionEndTurn()
				gameSession.executeAction(endTurnAction)
		else
			# if the turn timer has not expired, just send the time tick over to all clients
			totalStepCount = gameSession.getStepCount() - games[gameId].opponentEventDataBuffer.length
			emitGameEvent(null,gameId,{type: EVENTS.turn_time, time: turnTimeRemainingInSeconds, timestamp: Date.now(), stepCount: totalStepCount})

###*
 * Handler for an invalid action.
 ###
onInvalidAction = (event) ->
	# safety fallback: if player attempts to make an invalid explicit action, notify that player only
	gameSession = event.gameSession
	gameId = gameSession.gameId
	game = games[gameId]
	if game?
		action = event.action
		if !action.getIsImplicit()
			#Logger.module("...").log "[G:#{gameId}]", "onInvalidAction -> INVALID ACTION: #{action.getLogName()} / VALIDATED BY: #{action.getValidatorType()} / MESSAGE: #{action.getValidationMessage()}"
			invalidActionEventData = {
				type: EVENTS.invalid_action,
				playerId: action.getOwnerId(),
				action: JSON.parse(game.session.serializeToJSON(action)),
				validatorType: event.validatorType,
				validationMessage: event.validationMessage,
				validationMessagePosition: event.validationMessagePosition,
				desync: gameSession.isActive() and
					gameSession.getCurrentPlayerId() == action.getOwnerId() and
					gameSession.getTurnTimeRemaining() > CONFIG.TURN_DURATION_LATENCY_BUFFER
			}
			emitGameEvent(null, gameId, invalidActionEventData)

###*
 * Handler for a game session step.
 ###
onStep = (event) ->
	gameSession = event.gameSession
	gameId = gameSession.gameId
	game = games[gameId]
	if game?
		step = event.step
		if step? and step.timestamp? and step.action?
			# send out step events
			stepEventData = {type: EVENTS.step, step: JSON.parse(game.session.serializeToJSON(step))}
			emitGameEvent(null, gameId, stepEventData)

			# special action cases
			action = step.action
			if action instanceof SDK.EndTurnAction
				# save game on end turn
				# delay so that we don't block sending the step back to the players
				_.delay((()->
					if games[gameId]? and games[gameId].session?
						GameManager.saveGameSession(gameId, games[gameId].session.serializeToJSON(games[gameId].session))
				), 500)
			else if action instanceof SDK.StartTurnAction
				# restart the turn timer whenever a turn starts
				restartTurnTimer(gameId)
			else if action instanceof SDK.DrawStartingHandAction
				# restart turn timer if both players have a starting hand and this step is for a DrawStartingHandAction
				bothPlayersHaveStartingHand = _.reduce(game.session.players,((memo,player)-> memo && player.getHasStartingHand()),true)
				if bothPlayersHaveStartingHand
					restartTurnTimer(gameId)

			if action.getIsAutomatic() and !game.session.getIsFollowupActive()
				# add bonus to turn time for every automatic step
				# unless followup is active, to prevent rollbacks for infinite turn time
				# bonus as a separate parameter accounts for cases such as:
				# - battle pet automatic actions eating up your own time
				# - queuing up many actions and ending turn quickly to eat into opponent's time
				game.turnTimeBonus += 2000

		# when game is over and we have the final step
		# we cannot archive game until final step event
		# because otherwise step won't be finished/signed correctly
		# so we must do this on step event and not on game_over event
		if game.session.status == SDK.GameStatus.over
			# stop any turn timers
			stopTurnTimer(gameId)
			if !game.isArchived?
				game.isArchived = true
				afterGameOver(gameId, game.session, game.mouseAndUIEvents)

###*
 * Leaves a game for a player socket if the socket is connected to a game
 * @public
 * @param {Socket} socket The socket which wants to leave a game.
 * @param {Boolean} [silent=false] whether to disconnect silently, as in the case of duplicate connections for same player
 ###
playerLeaveGameIfNeeded = (socket, silent=false) ->
	if socket?
		gameId = socket.gameId
		playerId = socket.playerId

		# if a player is in a game
		if gameId? and playerId?
			Logger.module("...").debug "[G:#{gameId}]", "playerLeaveGame -> #{playerId} has left game #{gameId}".red

			if !silent
				# broadcast that player left
				socket.broadcast.to(gameId).emit("player_left",playerId)

			# leave that game room
			socket.leave(gameId)

			# update user count for game room
			game = games[gameId]
			if game?
				index = game.connectedPlayers.indexOf(playerId)
				game.connectedPlayers.splice(index,1)

				if !silent
					# start disconnected player timeout for game
					startDisconnectedPlayerTimeout(gameId,playerId)

					# destroy game if no one is connected anymore
					destroyGameSessionIfNoConnectionsLeft(gameId,true)

			# finally clear the existing gameId
			socket.gameId = null

###*
# Start/Restart server side game timer for a game
# @public
# @param	{Object}		gameId			The game ID.
###
restartTurnTimer = (gameId) ->
	stopTurnTimer(gameId)

	game = games[gameId]
	if game.session?
		game.turnTimerStartedAt = game.turnTimeTickAt = Date.now()
		game.turnTimer = setInterval((()-> onGameTimeTick(gameId)),1000)

saveGameCount = (gameCount) ->
	serverId = os.hostname()
	Redis.hsetAsync("servers:#{serverId}", "games", gameCount)

savePlayerCount = (playerCount) ->
	serverId = os.hostname()
	Redis.hsetAsync("servers:#{serverId}", "players", playerCount)

### Shutdown Handler ###
shutdownHandler = () ->
	Logger.module("SERVER").log "Shutting down game server."
	Logger.module("SERVER").log "Active Players: #{playerCount}."
	Logger.module("SERVER").log "Active Games: #{gameCount}."

	if !config.get('consul.enabled')
		process.exit(0)

	return Consul.getReassignmentStatus()
	.then (reassign) ->
		if reassign == false
			Logger.module("SERVER").log "Reassignment disabled - exiting."
			process.exit(0)

		# Build an array of game IDs
		ids = []
		_.each games, (game, id) ->
			ids.push(id)

		# Map to save each game to Redis before shutdown
		return Promise.map ids, (id) ->
			serializedData = games[id].session.serializeToJSON(games[id].session)
			return GameManager.saveGameSession(id, serializedData)
		.then () ->
			return Consul.getHealthyServers()
		.then (servers) ->
			# Filter 'yourself' from list of nodes
			filtered = _.reject servers, (server)->
				return server["Node"]?["Node"] == os.hostname()

			if filtered.length == 0
				Logger.module("SERVER").log "No servers available - exiting without re-assignment."
				process.exit(1)

			random_node = _.sample(filtered)
			node_name = random_node["Node"]?["Node"]
			return Consul.kv.get("nodes/#{node_name}/public_ip")
		.then (newServerIp) ->
			# Development override for testing, bounces between port 9000 & 9001
			if config.isDevelopment()
				port = 9001 if config.get('port') is 9000
				port = 9000 if config.get('port') is 9001
				newServerIp = "127.0.0.1:#{port}"
			msg = "Server is shutting down. You will be reconnected automatically."
			io.emit "game_server_shutdown", {msg:msg,ip:newServerIp}
			Logger.module("SERVER").log "Players reconnecting to: #{newServerIp}"
			Logger.module("SERVER").log "Re-assignment complete. Exiting."
			process.exit(0)
		.catch (err) ->
			Logger.module("SERVER").log "Re-assignment failed: #{err.message}. Exiting."
			process.exit(1)

###*
# Stop server side game timer for a game
# @public
# @param	{Object}		gameId			The game ID.
###
stopTurnTimer = (gameId) ->
	game = games[gameId]
	if game? and game.turnTimer?
		clearInterval(game.turnTimer)
		game.turnTimer = null

module.exports = {
	onGameEvent,
	onInvalidAction,
	onStep,
	playerLeaveGameIfNeeded,
	savePlayerCount,
	shutdownHandler
}
