# Single-Player Game Server
_ = require 'underscore'
http = require 'http'
io = require 'socket.io'
ioJwt = require '@thream/socketio-jwt'
moment = require 'moment'
os = require 'os'
url = require 'url'

CONFIG = require '../app/common/config'
EVENTS = require '../app/common/event_types'
GameLib = require './lib/game_common.coffee'
Logger = require '../app/common/logger.coffee'
SDK = require '../app/sdk.coffee'
Spectate = require './lib/spectate.coffee'
StarterAI = require './ai/starter_ai'
UtilsGameSession = require '../app/common/utils/utils_game_session.coffee'
config = require '../config/config'

# Boots up a basic HTTP server on port 8080
# Responds to /health endpoint with status 200
# Otherwise responds with status 404

# create http server and respond to /health requests
server = http.createServer (req, res) ->
	pathname = url.parse(req.url).pathname
	if pathname == '/health'
		Logger.module("GAME SERVER").debug "HTTP Health Ping"
		res.statusCode = 200
		res.write JSON.stringify({players: playerCount, games: gameCount})
		res.end()
	else
		res.statusCode = 404
		res.end()

# io server setup, binds to http server
io = require('socket.io')().listen(server, {
	cors: {
		origin: "*"
	}
})
io.use(
	ioJwt.authorize(
		secret: config.get('firebase.legacyToken')
		timeout: 15000
	)
)
module.exports = io
server.listen config.get('game_port'), () ->
	Logger.module("AI SERVER").log "AI Server <b>#{os.hostname()}</b> started."

# the 'games' hash maps game IDs to References for those games
games = {}

# save some basic stats about this server into redis
playerCount = 0
gameCount = 0

# turn times
MAX_TURN_TIME = (CONFIG.TURN_DURATION + CONFIG.TURN_DURATION_LATENCY_BUFFER) * 1000.0
MAX_TURN_TIME_INACTIVE = (CONFIG.TURN_DURATION_INACTIVE + CONFIG.TURN_DURATION_LATENCY_BUFFER) * 1000.0

# health ping on socket namespace /health
healthPing = io
	.of '/health'
	.on 'connection', (socket) ->
		socket.on 'ping', () ->
			Logger.module("GAME SERVER").debug "socket.io Health Ping"
			socket.emit 'pong'

io.sockets.on "connection", (socket) ->
	# Socket is now autheticated, continue to bind other handlers
	socket.decoded_token = socket.decodedToken # Socket.io 4.x compat
	Logger.module("IO").log "DECODED TOKEN ID: #{socket.decoded_token.d.id.blue}"
	Logger.module("IO").log "TOKEN ID: #{socket.id.blue}"
	GameLib.savePlayerCount(++playerCount)

	# Send message to user that connection is succesful
	socket.emit "connected",
		message: "Successfully connected to server"

	# Bind socket event handlers
	socket.on EVENTS.join_game, onGamePlayerJoin
	socket.on EVENTS.spectate_game, Spectate.onGameSpectatorJoin
	socket.on EVENTS.leave_game, onGameLeave
	socket.on EVENTS.network_game_event, GameLib.onGameEvent
	socket.on "disconnect", onGameDisconnect

###
# socket handler for players joining game
# @public
# @param  {Object}  requestData  Plain JS object with socket event data.
###
# NOTE: This function is duplicated in game/single_player in order to provide access to the global io.sockets object.
onGamePlayerJoin = (requestData) ->
  gameId = requestData.gameId
  playerId = requestData.playerId

  Logger.module("IO").debug "[G:#{gameId}]", "join_game -> player:#{requestData.playerId} is joining game:#{requestData.gameId}".cyan

  # you must have a playerId
  if not playerId
    Logger.module("IO").error "[G:#{gameId}]", "join_game -> REFUSING JOIN: A player #{playerId.blue} is not valid".red
    @emit "join_game_response",
      error:"Your player id seems to be blank (has your login expired?), so we can't join you to the game."
    return

  # must have a gameId
  if not gameId
    Logger.module("IO").error "[G:#{gameId}]", "join_game -> REFUSING JOIN: A gameId #{gameId.blue} is not valid".red
    @emit "join_game_response",
      error:"Invalid Game ID."
    return

  # if someone is trying to join a game they don't belong to as a player they are not authenticated as
  if @.decoded_token.d.id != playerId
    Logger.module("IO").error "[G:#{gameId}]", "join_game -> REFUSING JOIN: A player #{@.decoded_token.d.id.blue} is attempting to join a game as #{playerId.blue}".red
    @emit "join_game_response",
      error:"Your player id does not match the one you requested to join a game with. Are you sure you're joining the right game?"
    return

  # if a client is already in another game, leave it
  GameLib.playerLeaveGameIfNeeded(this)

  # if this client already exists in this game, disconnect duplicate client
  io.sockets.adapter.rooms.get(gameId)?.forEach((socketId) ->
    socket = io.sockets.sockets.get(socketId)
    if socket? and socket.playerId == playerId
      Logger.module("IO").error "[G:#{gameId}]", "join_game -> detected duplicate connection to #{gameId} GameSession for #{playerId.blue}. Disconnecting duplicate...".cyan
      GameLib.playerLeaveGameIfNeeded(socket, silent=true)
  )

  # initialize a server-side game session and join it
  initGameSession(gameId)
  .bind @
  .spread (gameSession) ->
    #Logger.module("IO").debug "[G:#{gameId}]", "join_game -> players in data: ", gameSession.players
    player = _.find(gameSession.players, (p) -> return p.playerId == playerId)

    # get the opponent based on the game session data
    opponent = _.find(gameSession.players, (p) -> return p.playerId != playerId)

    Logger.module("IO").debug "[G:#{gameId}]", "join_game -> Got #{gameId} GameSession data #{playerId.blue}.".cyan
    if not player # oops looks like this player does not exist in the requested game
      # let the socket know we had an error
      @emit "join_game_response",
        error:"could not join game because your player id could not be found"

      # destroy the game data loaded so far if the opponent can't be defined and no one else is connected
      Logger.module("IO").error "[G:#{gameId}]", "onGameJoin -> DESTROYING local game cache due to join error".red
      destroyGameSessionIfNoConnectionsLeft(gameId)

      # stop any further processing
      return

    else if not opponent? # oops, looks like we can'f find an opponent in the game session?
      Logger.module("IO").error "[G:#{gameId}]", "join_game -> game #{gameId} ERROR: could not find opponent for #{playerId.blue}.".red

      # let the socket know we had an error
      @emit "join_game_response",
        error:"could not join game because the opponent could not be found"

      # destroy the game data loaded so far if the opponent can't be defined and no one else is connected
      Logger.module("IO").error "[G:#{gameId}]", "onGameJoin -> DESTROYING local game cache due to join error".red
      destroyGameSessionIfNoConnectionsLeft(gameId)
      # stop any further processing
      return
    else
      # rollback if it is this player's followup
      # this can happen if a player reconnects without properly disconnecting
      if gameSession.getIsFollowupActive() and gameSession.getCurrentPlayerId() == playerId
        gameSession.executeAction(gameSession.actionRollbackSnapshot())

      # set some parameters for the socket
      @gameId = gameId
      @playerId = playerId

      # join game room
      @join(gameId)

      # update user count for game room
      games[gameId].connectedPlayers.push(playerId)
      Logger.module("IO").debug "[G:#{gameId}]", "join_game -> Game #{gameId} connected players so far: #{games[gameId].connectedPlayers.length}."

      # if only one player is in so far, start the disconnection timer
      if games[gameId].connectedPlayers.length == 1
        # start disconnected player timeout for game
        startDisconnectedPlayerTimeout(gameId,opponent.playerId)
      else if games[gameId].connectedPlayers.length == 2
        # clear timeout when we get two players
        clearDisconnectedPlayerTimeout(gameId)

      # prepare and scrub game session data for this player
      # if a followup is active and it isn't this player's followup, send them the rollback snapshot
      if gameSession.getIsFollowupActive() and gameSession.getCurrentPlayerId() != playerId
        gameSessionData = JSON.parse(gameSession.getRollbackSnapshotData())
      else
        gameSessionData = JSON.parse(gameSession.serializeToJSON(gameSession))
      UtilsGameSession.scrubGameSessionData(gameSession, gameSessionData, playerId)

      # respond to client with success and a scrubbed copy of the game session
      @emit "join_game_response",
        message: "successfully joined game"
        gameSessionData: gameSessionData
        connectedPlayers:games[gameId].connectedPlayers
        connectedSpectators: Spectate.getConnectedSpectatorsDataForGamePlayer(gameId,playerId)

      # broadcast join to any other connected players
      @broadcast.to(gameId).emit("player_joined",playerId)
  .catch (e) ->
    Logger.module("IO").error "[G:#{gameId}]", "join_game -> player:#{playerId} failed to join game, error: #{e.message}".red
    Logger.module("IO").error "[G:#{gameId}]", "join_game -> player:#{playerId} failed to join game, error stack: #{e.stack}".red
    # if we didn't join a game, broadcast a failure
    @emit "join_game_response",
      error:"Could not join game: " + e?.message

###
# socket handler for leaving a game.
# @public
# @param	{Object}	requestData		Plain JS object with socket event data.
###
onGameLeave = (requestData) ->
	if @.spectatorId
		Logger.module("IO").log "[G:#{@.gameId}]", "leave_game -> spectator #{@.spectatorId} leaving #{@.gameId}"
		Spectate.spectatorLeaveGameIfNeeded(@)
	else
		Logger.module("IO").log "[G:#{@.gameId}]", "leave_game -> player #{@.playerId} leaving #{@.gameId}"
		GameLib.playerLeaveGameIfNeeded(@)

###
# Socket Disconnect Event Handler. Handles rollback if in the middle of followup etc.
# @public
###
onGameDisconnect = () ->
	if @.spectatorId
		# make spectator leave game room
		Spectate.spectatorLeaveGameIfNeeded(@)

	else
		try
			io.sockets.adapter.rooms.get(@.gameId)?.forEach((socketId) ->
				socket = io.sockets.sockets.get(socketId)
				if socket.playerId == @.playerId
					Logger.module("IO").log "onGameDisconnect:: looks like the player #{@.playerId} we are trying to disconnect is still in the game #{@.gameId} room. ABORTING".red
					return
			)

			for clientId, socket of io.sockets.sockets
				if socket.playerId == @.playerId and not socket.spectatorId
					Logger.module("IO").log "onGameDisconnect:: looks like the player #{@.playerId} that allegedly disconnected is still alive and well.".red
					return

		catch error
			Logger.module("IO").log "onGameDisconnect:: Error #{error?.message}.".red

		# if we are in a buffering state
		# and the disconnecting player is in the middle of a followup
		gs = games[@gameId]?.session
		if gs? and gs.getIsBufferingEvents() and gs.getCurrentPlayerId() == @playerId
			# execute a rollback to reset server state
			# but do not send this action to the still connected player
			# because they do not care about rollbacks for the other player
			rollBackAction = gs.actionRollbackSnapshot()
			gs.executeAction(rollBackAction)

		GameLib.savePlayerCount(--playerCount)
		Logger.module("IO").log "[G:#{@.gameId}]", "disconnect -> #{@.playerId}".red

		# if a client is already in another game, leave it
		GameLib.playerLeaveGameIfNeeded(@)

###
# Clears timeout for disconnected players
# @public
# @param	{String}	gameId			The ID of the game to clear disconnected timeout for.
###
clearDisconnectedPlayerTimeout = (gameId) ->
	Logger.module("IO").log "[G:#{gameId}]", "clearDisconnectedPlayerTimeout:: for game: #{gameId}".yellow
	clearTimeout(games[gameId]?.disconnectedPlayerTimeout)
	games[gameId]?.disconnectedPlayerTimeout = null

###
# Starts timeout for disconnected players
# @public
# @param	{String}	gameId			The ID of the game.
# @param	{String}	playerId		The player ID for who to start the timeout.
###
startDisconnectedPlayerTimeout = (gameId,playerId) ->
	if games[gameId]?.disconnectedPlayerTimeout?
		clearDisconnectedPlayerTimeout(gameId)
	Logger.module("IO").log "[G:#{gameId}]", "startDisconnectedPlayerTimeout:: for #{playerId} in game: #{gameId}".yellow

	games[gameId]?.disconnectedPlayerTimeout = setTimeout(()->
		onDisconnectedPlayerTimeout(gameId,playerId)
	,60000)

###
# Resigns game for disconnected player.
# @public
# @param	{String}	gameId			The ID of the game.
# @param	{String}	playerId		The player ID who is resigning.
###
onDisconnectedPlayerTimeout = (gameId,playerId) ->
	Logger.module("IO").log "[G:#{gameId}]", "onDisconnectedPlayerTimeout:: #{playerId} for game: #{gameId}"

	io.sockets.adapter.rooms.get(gameId)?.forEach((socketId) ->
		socket = io.sockets.sockets.get(socketId)
		if socket.playerId == playerId
			Logger.module("IO").log "[G:#{gameId}]", "onDisconnectedPlayerTimeout:: looks like the player #{playerId} we are trying to dis-connect is still in the game #{gameId} room. ABORTING".red
			return
	)

	for clientId, socket of io.sockets.sockets
		if socket.playerId == playerId and not socket.spectatorId
			Logger.module("IO").log "[G:#{gameId}]", "onDisconnectedPlayerTimeout:: looks like the player #{playerId} we are trying to disconnect is still connected but not in the game #{gameId} room.".red
			return


	# grab the relevant game session
	gs = games[gameId]?.session

	# looks like we timed out for a game that's since ended
	if !gs or gs?.status == SDK.GameStatus.over

		Logger.module("IO").log "[G:#{gameId}]", "onDisconnectedPlayerTimeout:: #{playerId} timed out for FINISHED or NULL game: #{gameId}".yellow
		return

	else

		Logger.module("IO").log "[G:#{gameId}]", "onDisconnectedPlayerTimeout:: #{playerId} auto-resigning game: #{gameId}".yellow

		# resign the player
		player = gs.getPlayerById(playerId)
		resignAction = player.actionResign()
		gs.executeAction(resignAction)

###*
# Emit/Broadcast game event to appropriate destination.
# @public
# @param	{Socket}		event			Originating socket.
# @param	{String}		gameId			The game id for which to broadcast.
# @param	{Object}		eventData		Data to broadcast.
###
emitGameEvent = (fromSocket,gameId,eventData)->
	if games[gameId]?
		if eventData.type == EVENTS.step
			Logger.module("IO").log "[G:#{gameId}]", "emitGameEvent -> step #{eventData.step?.index?.toString().yellow} with timestamp #{eventData.step?.timestamp} and action #{eventData.step?.action?.type}"
			# only broadcast valid steps
			if eventData.step? and eventData.step.timestamp? and eventData.step.action?
				# send the step to the owner
				io.sockets.adapter.rooms.get(gameId)?.forEach((socketId) ->
					socket = io.sockets.sockets.get(socketId)
					if socket? and socket.playerId == eventData.step.playerId
						eventDataCopy = JSON.parse(JSON.stringify(eventData))
						# always scrub steps for sensitive data from player perspective
						UtilsGameSession.scrubSensitiveActionData(games[gameId].session, eventDataCopy.step.action, socket.playerId)
						Logger.module("IO").log "[G:#{gameId}]", "emitGameEvent -> transmitting step #{eventData.step?.index?.toString().yellow} with action #{eventData.step.action?.type} to origin"
						socket.emit EVENTS.network_game_event, eventDataCopy
						# NOTE: don't BREAK here because there is a potential case that during reconnection 3 sockets are connected:
						# 2 for this current reconnecting player and 1 for the opponent
						# breaking here would essentially result in only the DEAD socket in process of disconnecting receiving the event
						# break
				)

				# buffer actions for the opponent other than a rollback action since that should clear the buffer during followups and there's no need to be sent to the opponent
				# essentially: skip processing anything for the opponent if this is a RollbackToSnapshotAction since only the sender cares about that one
				if eventData.step.action.type != SDK.RollbackToSnapshotAction.type

					# start buffering events until a followup is complete for the opponent since players can cancel out of a followup
					games[gameId].opponentEventDataBuffer.push(eventData)

					# if we have anything in the buffer and we are currently not buffering, flush the buffer over to your opponent
					if games[gameId].opponentEventDataBuffer.length > 0 and !games[gameId].session.getIsBufferingEvents()
						# copy buffer and reset
						opponentEventDataBuffer = games[gameId].opponentEventDataBuffer.slice(0)
						games[gameId].opponentEventDataBuffer.length = 0

						# broadcast whatever's in the buffer to the opponent
						_.each(opponentEventDataBuffer, (eventData) ->
							io.sockets.adapter.rooms.get(gameId)?.forEach((socketId) ->
								socket = io.sockets.sockets.get(socketId)
								if socket? and socket.playerId != eventData.step.playerId
									eventDataCopy = JSON.parse(JSON.stringify(eventData))
									# always scrub steps for sensitive data from player perspective
									UtilsGameSession.scrubSensitiveActionData(games[gameId].session, eventDataCopy.step.action, socket.playerId)
									Logger.module("IO").log "[G:#{gameId}]", "emitGameEvent -> transmitting step #{eventData.step?.index?.toString().yellow} with action #{eventData.step.action?.type} to opponent"
									socket.emit EVENTS.network_game_event, eventDataCopy
							)
						)
		else if eventData.type == EVENTS.invalid_action
			# send the invalid action notification to the owner
			io.sockets.adapter.rooms.get(gameId)?.forEach((socketId) ->
				socket = io.sockets.sockets.get(socketId)
				if socket? and socket.playerId == eventData.playerId
					eventDataCopy = JSON.parse(JSON.stringify(eventData))
					socket.emit EVENTS.network_game_event, eventDataCopy
					# NOTE: don't BREAK here because there is a potential case that during reconnection 3 sockets are connected:
					# 2 for this current reconnecting player and 1 for the opponent
					# breaking here would essentially result in only the DEAD socket in process of disconnecting receiving the event
			)
		else
			if eventData.type == EVENTS.network_game_hover or eventData.type == EVENTS.network_game_select or eventData.type == EVENTS.network_game_mouse_clear or eventData.type == EVENTS.show_emote
				# save the player id of this event
				eventData.playerId ?= fromSocket?.playerId
				eventData.timestamp = moment().utc().valueOf()

				# mouse events, emotes, etc should be saved and persisted to S3 for replays
				games[gameId].mouseAndUIEvents ?= []
				games[gameId].mouseAndUIEvents.push(eventData)

			if fromSocket?
				# send it along to other connected sockets in the game room
				fromSocket.broadcast.to(gameId).emit EVENTS.network_game_event, eventData
			else
				# send to all sockets connected to the game room
				io.to(gameId).emit EVENTS.network_game_event, eventData

		# push a deep clone of the event data to the spectator buffer
		if games[gameId]?.spectateIsRunning
			spectatorEventDataCopy = JSON.parse(JSON.stringify(eventData))
			games[gameId].spectatorGameEventBuffer.push(spectatorEventDataCopy)

			# if we're not running a timed delay, just flush everything now
			if not games[gameId]?.spectateIsDelayed
				Spectate.flushSpectatorNetworkEventBuffer(gameId)

###*
 * Handler for before a game session rolls back to a snapshot.
 ###
onBeforeRollbackToSnapshot = (event) ->
	# clear the buffer just before rolling back
	gameSession = event.gameSession
	gameId = gameSession.gameId
	game = games[gameId]
	if game?
		game.opponentEventDataBuffer.length = 0
		game.spectatorOpponentEventDataBuffer.length = 0

###
# Subscribes to the gamesession's event bus.
# Can be called multiple times in order to re-subscribe.
# @public
# @param	{Object}		gameId			The game ID to subscribe for.
###
subscribeToGameSessionEvents = (gameId)->
	Logger.module("...").log "[G:#{gameId}]", "subscribeToGameSessionEvents -> subscribing to GameSession events"
	game = games[gameId]
	if game?
		# unsubscribe from previous
		unsubscribeFromGameSessionEvents(gameId)

		# listen for game events
		game.session.getEventBus().on(EVENTS.before_rollback_to_snapshot, onBeforeRollbackToSnapshot)
		game.session.getEventBus().on(EVENTS.step, GameLib.onStep)
		game.session.getEventBus().on(EVENTS.invalid_action, GameLib.onInvalidAction)

		# subscribe AI to events
		ai_subscribeToGameSessionEvents(gameId)

###
# Unsubscribe from event listeners on the game session for this game ID.
# @public
# @param	{String}		gameId			The game ID that needs to be unsubscribed.
###
unsubscribeFromGameSessionEvents = (gameId)->
	Logger.module("...").log "[G:#{gameId}]", "unsubscribeFromGameSessionEvents -> un-subscribing from GameSession events"
	game = games[gameId]
	if game?
		game.session.getEventBus().off(EVENTS.before_rollback_to_snapshot, onBeforeRollbackToSnapshot)
		game.session.getEventBus().off(EVENTS.step, GameLib.onStep)
		game.session.getEventBus().off(EVENTS.invalid_action, GameLib.onInvalidAction)

		ai_unsubscribeFromGameSessionEvents(gameId)

process.on "SIGTERM", GameLib.shutdownHandler
process.on "SIGINT", GameLib.shutdownHandler
process.on "SIGHUP", GameLib.shutdownHandler
process.on "SIGQUIT", GameLib.shutdownHandler

# region AI

###*
 * Returns whether a session is valid for AI usage.
 * @param	{String}		gameId
###
ai_isValidSession = (gameId) ->
	return games[gameId]?.session? and !games[gameId].session.isOver() and games[gameId].ai?

###*
 * Returns whether a session and turn is valid for AI usage.
 * @param	{String}		gameId
###
ai_isValidTurn = (gameId) ->
	return ai_isValidSession(gameId) and games[gameId].session.isActive() and games[gameId].session.getCurrentPlayerId() == games[gameId].ai.getMyPlayerId()

###*
 * Returns whether AI can start turn.
 * @param	{String}		gameId
###
ai_canStartTurn = (gameId) ->
	return ai_isValidTurn(gameId) and !ai_isExecutingTurn(gameId) and !games[gameId].session.hasStepsInQueue()

###*
 * Returns whether ai is currently executing turn.
 * @param	{String}		gameId
###
ai_isExecutingTurn = (gameId) ->
	return games[gameId].executingAITurn

###*
 * Returns whether ai can progress turn.
 * @param	{String}		gameId
###
ai_canProgressTurn = (gameId) ->
	return ai_isValidTurn(gameId) and ai_isExecutingTurn(gameId) and !games[gameId].aiStartTurnTimeoutId?

###*
 * Returns whether ai can taunt.
 * @param	{String}		gameId
###
ai_canEmote = (gameId) ->
	return ai_isValidSession(gameId) and !ai_isBot(gameId) and !games[gameId].session.getIsBufferingEvents() and Math.random() < 0.05

###*
 * Returns whether ai is normal ai or bot.
 * @param	{String}		gameId
###
ai_isBot = (gameId) ->
	return games[gameId]?.session? and games[gameId].session.getAiPlayerId() != CONFIG.AI_PLAYER_ID

###*
 * Initializes AI for a game session.
 * @param	{String}		gameId
###
ai_setup = (gameId) ->
	if games[gameId]?.session? and !games[gameId].ai?
		aiPlayerId = games[gameId].session.getAiPlayerId()
		aiDifficulty = games[gameId].session.getAiDifficulty()
		Logger.module("AI").debug "[G:#{gameId}]", "Setup AI -> aiPlayerId #{aiPlayerId} - aiDifficulty #{aiDifficulty}"
		games[gameId].ai = new StarterAI(games[gameId].session, aiPlayerId, aiDifficulty)

		# add AI as a connected player
		games[gameId].connectedPlayers.push(games[gameId].session.getAiPlayerId())

		# attempt to mulligan immediately on new game
		if games[gameId].session.isNew()
			nextAction = games[gameId].ai.nextAction()
			if nextAction?
				games[gameId].session.executeAction(nextAction)

###*
 * Terminates AI for a game session.
 * @param	{String}		gameId
###
ai_terminate = (gameId) ->
	ai_unsubscribeFromGameSessionEvents(gameId)
	ai_stopTurn(gameId)
	ai_stopTimeouts(gameId)

ai_onStep = (event) ->
	gameSession = event.gameSession
	gameId = gameSession.gameId
	# emote after step
	ai_emoteForLastStep(gameId)

	# progress turn
	ai_updateTurn(gameId)

ai_onInvalidAction = (event) ->
	# safety fallback: if AI attempts to make an invalid explicit action, end AI turn immediately
	if event?
		gameSession = event.gameSession
		gameId = gameSession.gameId
		action = event.action
		if action? and !action.getIsImplicit() and ai_isExecutingTurn(gameId) and action.getOwnerId() == games[gameId].ai.getMyPlayerId()
			ai_endTurn(gameId)

ai_subscribeToGameSessionEvents = (gameId) ->
	game = games[gameId]
	if game?
		# if we're already subscribed, unsubscribe
		ai_unsubscribeFromGameSessionEvents(gameId)

		# listen for game events
		game.session.getEventBus().on(EVENTS.step, ai_onStep)
		game.session.getEventBus().on(EVENTS.invalid_action, ai_onInvalidAction)

ai_unsubscribeFromGameSessionEvents = (gameId) ->
	game = games[gameId]
	if game?
		game.session.getEventBus().off(EVENTS.step, ai_onStep)
		game.session.getEventBus().off(EVENTS.invalid_action, ai_onInvalidAction)

###*
 * Updates AI turn for a game session.
 * @param	{String}		gameId
###
ai_updateTurn = (gameId) ->
	Logger.module("AI").debug "[G:#{gameId}]", "ai_updateTurn"
	if ai_canStartTurn(gameId)
		ai_startTurn(gameId)
	else if ai_canProgressTurn(gameId)
		ai_progressTurn(gameId)
	else if ai_isExecutingTurn(gameId)
		ai_endTurn(gameId)

###*
 * Progresses AI turn for a game session.
 * @param	{String}		gameId
###
ai_progressTurn = (gameId) ->
	if ai_canProgressTurn(gameId)
		Logger.module("AI").debug "[G:#{gameId}]", "ai_progressTurn".cyan
		# request next action from AI
		try
			nextAction = games[gameId].ai.nextAction()
		catch error
			Logger.module("IO").log "[G:#{gameId}]", "ai.nextAction:: error: #{JSON.stringify(error.message)}".red
			Logger.module("IO").log "[G:#{gameId}]", "ai.nextAction:: error stack: #{error.stack}".red

			# retain player id
			playerId = games[gameId].ai.getOpponentPlayerId()

			# delete but don't destroy game
			GameLib.destroyGameSessionIfNoConnectionsLeft(gameId,true)

			# send error to client, forcing reconnect on client side
			io.to(gameId).emit EVENTS.network_game_error, JSON.stringify(error.message)
			return

	# if we didn't have an error and somehow destroy the game data in the try/catch above
	if games[gameId]?
		if nextAction?
			# always delay AI actions slightly
			if !games[gameId].aiExecuteActionTimeoutId?
				if ai_isBot(gameId)
					if games[gameId].session.getIsFollowupActive()
						actionDelayTime = 1.0 + Math.random() * 3.0
					else if nextAction instanceof SDK.EndTurnAction
						actionDelayTime = 1.0 + Math.random() * 2.0
					else
						actionDelayTime = 1.0 + Math.random() * 8.0
				else
					if games[gameId].session.getIsFollowupActive()
						actionDelayTime = 0.0
					else
						actionDelayTime = 5.0

				# action delay time can never be more than a quarter of remaining turn time
				if games[gameId].turnTimeRemaining?
					actionDelayTime = Math.min((games[gameId].turnTimeRemaining * 0.25) / 1000.0, actionDelayTime)

				# show UI as needed
				ai_showUIForAction(gameId, nextAction, actionDelayTime)

				# delay and then execute action
				# delay must be at least 1 ms to ensure current call stack completes
				games[gameId].aiExecuteActionTimeoutId = setTimeout((() ->
					games[gameId].aiExecuteActionTimeoutId = null
					ai_showClearUI(gameId)
					ai_executeAction(gameId, nextAction)
				), Math.max(1.0, actionDelayTime * 1000.0))
		else if ai_isExecutingTurn(gameId)
			# end turn as needed
			ai_endTurn(gameId)

###*
 * Starts AI turn for a game session.
 * @param	{String}		gameId
###
ai_startTurn = (gameId) ->
	if ai_canStartTurn(gameId)
		Logger.module("AI").debug "[G:#{gameId}]", "ai_startTurn".cyan
		# set as executing AI turn
		games[gameId].executingAITurn = true

		if !games[gameId].aiStartTurnTimeoutId?
			# delay initial turn progress
			if ai_isBot(gameId)
				delayTime = 2.0 + Math.random() * 2.0
			else
				delayTime = 2.0

			# choose random starting point for pointer
			games[gameId].aiPointer = {
				x: Math.floor(Math.random() * CONFIG.BOARDCOL),
				y: Math.floor(Math.random() * CONFIG.BOARDROW)
			}
			Logger.module("AI").debug "[G:#{gameId}]", "ai_startTurn init aiPointer at #{games[gameId].aiPointer.x}, #{games[gameId].aiPointer.y}".cyan

			# delay must be at least 1 ms to ensure current call stack completes
			games[gameId].aiStartTurnTimeoutId = setTimeout((()->
				games[gameId].aiStartTurnTimeoutId = null
				ai_progressTurn(gameId)
			), Math.max(1.0, delayTime * 1000.0))

###*
 * Stops AI turn for a game session, and ends it if necessary.
 * @param	{String}		gameId
###
ai_endTurn = (gameId) ->
	# stop turn
	ai_stopTurn(gameId)

	# force end turn if still AI's turn
	if ai_isValidTurn(gameId)
		Logger.module("AI").debug "[G:#{gameId}]", "ai_endTurn".cyan
		ai_executeAction(gameId, games[gameId].session.actionEndTurn())

###*
 * Stops AI turn for a game session. Does not end AI turn.
 * @param	{String}		gameId
###
ai_stopTurn = (gameId) ->
	if games[gameId].executingAITurn
		Logger.module("AI").debug "[G:#{gameId}]", "ai_stopTurn".cyan
		games[gameId].executingAITurn = false

		ai_stopTurnTimeouts(gameId)

###*
 * Stops AI timeouts for a game session.
 * @param	{String}		gameId
###
ai_stopTimeouts = (gameId) ->
	ai_stopTurnTimeouts(gameId)
	ai_stopEmoteTimeouts(gameId)
	ai_stopUITimeouts(gameId)

###*
 * Stops AI timeouts for turn actions.
 * @param	{String}		gameId
###
ai_stopTurnTimeouts = (gameId) ->
	if games[gameId].aiStartTurnTimeoutId?
		clearTimeout(games[gameId].aiStartTurnTimeoutId)
		games[gameId].aiStartTurnTimeoutId = null

	if games[gameId].aiExecuteActionTimeoutId?
		clearTimeout(games[gameId].aiExecuteActionTimeoutId)
		games[gameId].aiExecuteActionTimeoutId = null

###*
 * Executes an AI action for a game session.
 * @param	{String}		gameId
 * @param	{Action}		action
###
ai_executeAction = (gameId, action) ->
	if ai_canProgressTurn(gameId)
		Logger.module("AI").debug "[G:#{gameId}]", "ai_executeAction -> #{action.getLogName()}".cyan
		# simulate AI sending step to server
		step = new SDK.Step(games[gameId].session, action.getOwnerId())
		step.setAction(action)
		opponentPlayerId = games[gameId].ai.getOpponentPlayerId()
		io.sockets.adapter.rooms.get(gameId)?.forEach((socketId) ->
			socket = io.sockets.sockets.get(socketId)
			if socket.playerId == opponentPlayerId and !socket.spectatorId
				onGameEvent.call(socket, {
					type: EVENTS.step
					step: JSON.parse(games[gameId].session.serializeToJSON(step))
				})
		)

###*
* Returns whether an action is valid for showing UI.
* @param	{String}		gameId
* @param	{Action}		action
*	@return {Boolean}
###
ai_isValidActionForUI = (gameId, action) ->
	return (games[gameId].session.getIsFollowupActive() and !(action instanceof SDK.EndFollowupAction)) or
			action instanceof SDK.ReplaceCardFromHandAction or
			action instanceof SDK.PlayCardFromHandAction or
			action instanceof SDK.PlaySignatureCardAction or
			action instanceof SDK.MoveAction or
			action instanceof SDK.AttackAction

###*
* Shows UI for an action that will be taken by AI.
* @param	{String}		gameId
* @param	{Action}		action
* @param	{Number}		actionDelayTime must be at least 0.25s or greater
###
ai_showUIForAction = (gameId, action, actionDelayTime) ->
	if ai_isValidTurn(gameId) and ai_isValidActionForUI(gameId, action) and _.isNumber(actionDelayTime) and actionDelayTime > 0.25
		aiPlayerId = games[gameId].ai.getMyPlayerId()

		# stop any previous UI animations
		ai_stopUITimeouts(gameId)

		# get ui animation times
		if ai_isBot(gameId)
			if games[gameId].session.getIsFollowupActive()
				uiDelayTime = actionDelayTime * (0.7 + Math.random() * 0.1)
				uiAnimationDuration = actionDelayTime - uiDelayTime
				moveToSelectDuration = 0.0
				pauseAtSelectDuration = 0.0
				pauseAtTargetDuration = (0.1 + Math.random() * 0.25) * uiAnimationDuration
				moveToTargetDuration = uiAnimationDuration - pauseAtTargetDuration
			else
				uiDelayTime = actionDelayTime * (0.4 + Math.random() * 0.4)
				uiAnimationDuration = actionDelayTime - uiDelayTime
				pauseAtTargetDuration = Math.min(1.0, (0.1 + Math.random() * 0.25) * uiAnimationDuration)
				moveToSelectDuration = (0.2 + Math.random() * 0.4) * (uiAnimationDuration - pauseAtTargetDuration)
				moveToTargetDuration = (0.4 + Math.random() * 0.5) * (uiAnimationDuration - pauseAtTargetDuration - moveToSelectDuration)
				pauseAtSelectDuration = uiAnimationDuration - pauseAtTargetDuration - moveToSelectDuration - moveToTargetDuration
		else
			uiDelayTime = actionDelayTime * 0.7
			uiAnimationDuration = actionDelayTime - uiDelayTime
			moveToSelectDuration = 0.0
			pauseAtSelectDuration = 0.0
			moveToTargetDuration = 0.0
			pauseAtTargetDuration = uiAnimationDuration

		# get action properties
		selectEventData = {
			type: EVENTS.network_game_select
			playerId: aiPlayerId
		}
		if action instanceof SDK.ReplaceCardFromHandAction
			intent = selectEventData.intentType = SDK.IntentType.DeckIntent
			handIndex = selectEventData.handIndex = action.getIndexOfCardInHand()
			selectPosition = { x: Math.round((handIndex + 0.5) * (CONFIG.BOARDCOL / CONFIG.MAX_HAND_SIZE)), y: -1 }
		else if action instanceof SDK.ApplyCardToBoardAction
			if action instanceof SDK.PlayCardFromHandAction
				intent = selectEventData.intentType = SDK.IntentType.DeckIntent
				handIndex = selectEventData.handIndex = action.getIndexOfCardInHand()
				selectPosition = { x: Math.round((handIndex + 0.5) * (CONFIG.BOARDCOL / CONFIG.MAX_HAND_SIZE)), y: -1 }
				targetPosition = action.getTargetPosition()
			else if action instanceof SDK.PlaySignatureCardAction
				intent = selectEventData.intentType = SDK.IntentType.DeckIntent
				isSignatureCard = true
				if action.getCard().isOwnedByPlayer2()
					selectEventData.player2SignatureCard = true
				else
					selectEventData.player1SignatureCard = true
				if aiPlayerId == games[gameId].session.getPlayer2Id()
					selectPosition = { x: CONFIG.BOARDCOL, y: Math.floor(CONFIG.BOARDROW * 0.5 + Math.random() * CONFIG.BOARDROW * 0.5) }
				else
					selectPosition = { x: -1, y: Math.floor(CONFIG.BOARDROW * 0.5 + Math.random() * CONFIG.BOARDROW * 0.5) }
				targetPosition = action.getTargetPosition()
			else
				# followup has no selection
				intent = selectEventData.intentType = SDK.IntentType.DeckIntent
				selectEventData = null
				selectPosition = action.getSourcePosition()
				targetPosition = action.getTargetPosition()
		else if action instanceof SDK.MoveAction
			intent = selectEventData.intentType = SDK.IntentType.MoveIntent
			cardIndex = selectEventData.cardIndex = action.getSourceIndex()
			card = games[gameId].session.getCardByIndex(cardIndex)
			selectPosition = card.getPosition()
			targetPosition = action.getTargetPosition()
		else if action instanceof SDK.AttackAction
			intent = selectEventData.intentType = SDK.IntentType.DamageIntent
			cardIndex = selectEventData.cardIndex = action.getSourceIndex()
			card = games[gameId].session.getCardByIndex(cardIndex)
			selectPosition = card.getPosition()
			targetPosition = action.getTargetPosition()

		# failsafe in case action doesn't have a select position
		# (actions should always have a select position)
		if !selectPosition?
			if action instanceof SDK.ApplyCardToBoardAction
				Logger.module("AI").log "[G:#{gameId}]", "ai_showUIForAction -> no sel pos #{action.getLogName()} w/ card #{action.getCard()?.getName()} w/ root #{action.getCard()?.getRootCard()?.getName()}".cyan
			else
				Logger.module("AI").log "[G:#{gameId}]", "ai_showUIForAction -> no sel pos #{action.getLogName()}".cyan
			return

		# setup sequence
		actionPointerSequence = () ->
			# move to select
			ai_animatePointer(gameId, moveToSelectDuration, selectPosition, SDK.IntentType.NeutralIntent, false, isSignatureCard, () ->
				if selectEventData?
					if action instanceof SDK.MoveAction or action instanceof SDK.AttackAction
						# clear pointer before select
						emitGameEvent(null, gameId, {
							type: EVENTS.network_game_mouse_clear
							playerId: aiPlayerId,
							intentType: SDK.IntentType.NeutralIntent
						})

					# show selection event
					emitGameEvent(null, gameId, selectEventData)

				if targetPosition?
					# pause at select
					ai_animatePointer(gameId, pauseAtSelectDuration, selectPosition, intent, isSignatureCard, false, () ->
						# move to target
						ai_animatePointer(gameId, moveToTargetDuration, targetPosition, intent)
					)
			)

		# random chance to hover enemy unit on the board
		if ai_isBot(gameId) and uiDelayTime >= 5.0 && Math.random() < 0.05
			opponentGeneral = games[gameId].session.getGeneralForOpponentOfPlayerId(games[gameId].session.getAiPlayerId())
			units = games[gameId].session.getBoard().getFriendlyEntitiesForEntity(opponentGeneral)
			if units.length > 0
				unitToHover = units[Math.floor(Math.random() * units.length)]

		if unitToHover?
			# hover unit before showing action UI
			unitPosition = unitToHover.getPosition()
			moveToUnitDuration = Math.random() * 1.0
			pauseAtUnitDuration = 2.0 + Math.random() * 2.0
			uiDelayTime = uiDelayTime - moveToUnitDuration - pauseAtUnitDuration

			# delay for remaining time
			games[gameId].aiShowUITimeoutId = setTimeout(() ->
				games[gameId].aiShowUITimeoutId = null
				# move to random unit
				ai_animatePointer(gameId, moveToUnitDuration, unitPosition, SDK.IntentType.NeutralIntent, false, false, () ->
					# pause at random unit and then show action pointer sequence
					games[gameId].aiShowUITimeoutId = setTimeout(() ->
						games[gameId].aiShowUITimeoutId = null
						actionPointerSequence()
					, pauseAtUnitDuration * 1000.0)
				)
			, uiDelayTime * 1000.0)
		else
			# delay and then show action pointer sequence
			games[gameId].aiShowUITimeoutId = setTimeout(() ->
				games[gameId].aiShowUITimeoutId = null
				actionPointerSequence()
			, uiDelayTime * 1000.0)

ai_showClearUI = (gameId) ->
	if ai_isValidTurn(gameId)
		ai_stopUITimeouts(gameId)
		emitGameEvent(null, gameId, {
			type: EVENTS.network_game_mouse_clear
			playerId: games[gameId].ai.getMyPlayerId(),
			intentType: SDK.IntentType.NeutralIntent
		})

###*
 * Clears out any timeouts for AI UI.
 * @param	{String}		gameId
 ###
ai_stopUITimeouts = (gameId) ->
	if games[gameId]?
		if games[gameId].aiShowUITimeoutId?
			clearTimeout(games[gameId].aiShowUITimeoutId)
			games[gameId].aiShowUITimeoutId = null

		ai_stopAnimatingPointer(gameId)

###*
 * Shows AI pointer hover at a board position if it is different from the current position.
* @param	{String}		gameId
* @param	{Number}		boardX
* @param	{Number}		boardY
* @param	{Number}		[intent]
* @param	{Number}		[isSignatureCard=false]
 ###
ai_showHover = (gameId, boardX, boardY, intent=SDK.IntentType.NeutralIntent, isSignatureCard=false) ->
	if ai_isValidTurn(gameId)
		pointer = games[gameId].aiPointer
		if pointer.x != boardX or pointer.y != boardY
			# set pointer to position
			pointer.x = boardX
			pointer.y = boardY

			# setup hover event data
			hoverEventData = {
				type: EVENTS.network_game_hover
				boardPosition: {x: boardX, y: boardY},
				playerId: games[gameId].ai.getMyPlayerId(),
				intentType: intent
			}

			# check for hover target
			if isSignatureCard
				if games[gameId].ai.getMyPlayerId() == games[gameId].session.getPlayer2Id()
					hoverEventData.player2SignatureCard = true
				else
					hoverEventData.player1SignatureCard = true
			else
				target = games[gameId].session.getBoard().getUnitAtPosition(pointer)
				if target?
					hoverEventData.cardIndex = target.getIndex()

			# show hover
			emitGameEvent(null, gameId, hoverEventData)

###*
* Animates AI pointer movement.
* @param	{String}		gameId
* @param	{Number}		duration in seconds
* @param	{Vec2}		[targetBoardPosition]
* @param	{Number}		[intent]
* @param	{Number}		[isSignatureCardAtSource]
* @param	{Number}		[isSignatureCardAtTarget]
* @param	{Function}		[callback]
###
ai_animatePointer = (gameId, duration, targetBoardPosition, intent, isSignatureCardAtSource, isSignatureCardAtTarget, callback) ->
	if ai_isValidTurn(gameId)
		# stop current animation
		ai_stopAnimatingPointer(gameId)

		pointer = games[gameId].aiPointer
		sx = pointer.x
		sy = pointer.y
		tx = targetBoardPosition.x
		ty = targetBoardPosition.y
		dx = tx - sx
		dy = ty - sy

		if duration > 0.0
			# show pointer at source
			ai_showHover(gameId, sx, sy, intent, isSignatureCardAtSource)

			# animate to target
			dms = duration * 1000.0
			startTime = Date.now()
			games[gameId].aiPointerIntervalId = setInterval(() ->
				# cubic ease out
				currentTime = Date.now()
				dt = currentTime - startTime
				val = Math.min(1.0, dt / dms)
				e = val - 1
				ee = e * e * e + 1
				cx = dx * ee + sx
				cy = dy * ee + sy
				ai_showHover(gameId, Math.round(cx), Math.round(cy), intent, isSignatureCardAtTarget)
				if val == 1.0
					ai_stopAnimatingPointer(gameId)
					if callback then callback()
			, dms / 10)
		else
			# show pointer at target
			ai_showHover(gameId, tx, ty, intent, isSignatureCardAtTarget)

			# no animation needed
			if callback then callback()

###*
 * Stops showing AI pointer movement.
 ###
ai_stopAnimatingPointer = (gameId) ->
	if games[gameId]? and games[gameId].aiPointerIntervalId != null
		clearInterval(games[gameId].aiPointerIntervalId)
		games[gameId].aiPointerIntervalId = null

###*
	* Prompts AI to emote to opponent based on last step.
	* @param	{String}		gameId
###
ai_emoteForLastStep = (gameId) ->
	if ai_canEmote(gameId)
		step = games[gameId].session.getLastStep()
		action = step?.action
		if action? and !(action instanceof SDK.EndTurnAction)
			aiPlayerId = games[gameId].ai.getMyPlayerId()
			isMyAction = action.getOwnerId() == aiPlayerId

			# search action + sub actions for any played or removed units
			actionsToSearch = [action]
			numHappyActions = 0
			numTauntingActions = 0
			numAngryActions = 0
			while actionsToSearch.length > 0
				searchAction = actionsToSearch.shift()
				if searchAction instanceof SDK.RemoveAction
					if !isMyAction and searchAction.getTarget()?.getOwnerId() == aiPlayerId
						numAngryActions += 2
					else if isMyAction and searchAction.getTarget()?.getOwnerId() != aiPlayerId
						numTauntingActions += 1
				else if searchAction instanceof SDK.HealAction
					if isMyAction and searchAction.getTarget()?.getOwnerId() == aiPlayerId
						numTauntingActions += 1
					else if !isMyAction and searchAction.getTarget()?.getOwnerId() != aiPlayerId
						numAngryActions += 1
				else if searchAction instanceof SDK.PlayCardFromHandAction or searchAction instanceof SDK.PlaySignatureCardAction
					if isMyAction and searchAction.getCard() instanceof SDK.Unit
						numHappyActions += 1

				# add sub actions
				actionsToSearch = actionsToSearch.concat(searchAction.getSubActions())

			maxEmotion = Math.max(numHappyActions, numTauntingActions, numAngryActions)
			if maxEmotion > 0
				emoteIds = []
				myGeneral = games[gameId].ai.getMyGeneral()
				myGeneralId = myGeneral.getId()
				factionEmotesData = SDK.CosmeticsFactory.cosmeticsForTypeAndFaction(SDK.CosmeticsTypeLookup.Emote, myGeneral.getFactionId())

				# use ai faction emote that were most present in last step
				if maxEmotion == numAngryActions
					for emoteData in factionEmotesData
						if emoteData.enabled and (emoteData.title == "Angry" or emoteData.title == "Sad" or emoteData.title == "Frustrated") and (emoteData.generalId == myGeneralId)
							emoteIds.push(emoteData.id)
				else if maxEmotion == numHappyActions
					for emoteData in factionEmotesData
						if emoteData.enabled and emoteData.title == "Happy" and (emoteData.generalId == myGeneralId)
							emoteIds.push(emoteData.id)
				else if maxEmotion == numTauntingActions
					for emoteData in factionEmotesData
						if emoteData.enabled and (emoteData.title == "Taunt" or emoteData.title == "Sunglasses" or emoteData.title == "Kiss") and (emoteData.generalId == myGeneralId)
							emoteIds.push(emoteData.id)

				# pick a random emote
				emoteId = emoteIds[Math.floor(Math.random() * emoteIds.length)]
			#Logger.module("AI").debug "[G:#{gameId}]", "ai_emoteForLastStep -> #{emoteId} for #{games[gameId].session.getLastStep()?.action?.getLogName()}".cyan
			if emoteId?
				# clear any waiting emote timeout
				ai_stopEmoteTimeouts(gameId)

				# delay must be at least 1 ms to ensure current call stack completes
				games[gameId].aiEmoteTimeoutId = setTimeout((()->
					games[gameId].aiEmoteTimeoutId = null
					#Logger.module("AI").debug "[G:#{gameId}]", "ai_showEmote -> #{emoteId}".cyan
					emitGameEvent(null, gameId, {
						type: EVENTS.show_emote
						id: emoteId,
						playerId: games[gameId].ai.getMyPlayerId()
					})
				), 4000.0)

###*
 * Stops AI timeouts for emotes.
 * @param	{String}		gameId
###
ai_stopEmoteTimeouts = (gameId) ->
	if games[gameId].aiEmoteTimeoutId?
		clearTimeout(games[gameId].aiEmoteTimeoutId)
		games[gameId].aiEmoteTimeoutId = null

# endregion AI

# region SPECTATOR

###
# Runs actions delayed in the spectator buffer.
# @public
# @param  {Object}    gameId      The game for which to iterate the time.
###
# NOTE: This function is duplicated in game/single_player in order to provide access to the global io.sockets object.
flushSpectatorNetworkEventBuffer = (gameId) ->
  # if there is anything in the buffer
  if games[gameId].spectatorGameEventBuffer.length > 0
    # Logger.module("IO").debug "[G:#{gameId}]", "flushSpectatorNetworkEventBuffer()"

    # remove all the NULLED out actions
    games[gameId].spectatorGameEventBuffer = _.compact(games[gameId].spectatorGameEventBuffer)

    # loop through the actions in order
    for eventData,i in games[gameId].spectatorGameEventBuffer
      timestamp = eventData.timestamp || eventData.step?.timestamp
      # if we are not delaying events or if the event time exceeds the delay show it to spectators
      if not games[gameId].spectateIsDelayed || timestamp and moment().utc().valueOf() - timestamp > games[gameId].spectateDelay
        # null out the event that is about to be broadcast so it can be compacted later
        games[gameId].spectatorGameEventBuffer[i] = null
        if (eventData.step)
          Logger.module("IO").debug "[G:#{gameId}]", "flushSpectatorNetworkEventBuffer() -> broadcasting spectator step #{eventData.type} - #{eventData.step?.action?.type}"

          if games[gameId].spectateIsDelayed
            step = games[gameId].spectatorDelayedGameSession.deserializeStepFromFirebase(eventData.step)
            games[gameId].spectatorDelayedGameSession.executeAuthoritativeStep(step)
            # NOTE: we should be OK to contiue to use the eventData here since indices of all actions are the same becuase the delayed game sessions is running as non-authoriative

          # send events over to spectators of current player
          io.sockets.adapter.rooms.get("spectate-#{gameId}")?.forEach((socketId) ->
            Logger.module("IO").debug "[G:#{gameId}]", "flushSpectatorNetworkEventBuffer() -> transmitting step #{eventData.step?.index?.toString().yellow} with action #{eventData.step.action?.name} to player's spectators"
            socket = io.sockets.sockets.get(socketId)
            if socket? and socket.playerId == eventData.step.playerId
              # scrub the action data. this should not be skipped since some actions include entire deck that needs to be scrubbed because we don't want spectators deck sniping
              eventDataCopy = JSON.parse(JSON.stringify(eventData))
              # TODO: we use session to scrub here but might need to use the delayed session
              UtilsGameSession.scrubSensitiveActionData(games[gameId].session, eventDataCopy.step.action, socket.playerId, true)
              socket.emit EVENTS.network_game_event, eventDataCopy
          )

          # skip processing anything for the opponent if this is a RollbackToSnapshotAction since only the sender cares about that one
          if eventData.step.action.type == SDK.RollbackToSnapshotAction.type
            return

          # start buffering events until a followup is complete for the opponent since players can cancel out of a followup
          games[gameId].spectatorOpponentEventDataBuffer.push(eventData)

          # if we are delayed then check the delayed game session for if we are buffering, otherwise use the primary
          isSpectatorGameSessionBufferingFollowups = (games[gameId].spectateIsDelayed and games[gameId].spectatorDelayedGameSession?.getIsBufferingEvents()) || games[gameId].session.getIsBufferingEvents()

          Logger.module("IO").debug "[G:#{gameId}]", "flushSpectatorNetworkEventBuffer() -> opponentEventDataBuffer at #{games[gameId].spectatorOpponentEventDataBuffer.length} ... buffering: #{isSpectatorGameSessionBufferingFollowups}"

          # if we have anything in the buffer and we are currently not buffering, flush the buffer over to your opponent's spectators
          if games[gameId].spectatorOpponentEventDataBuffer.length > 0 and !isSpectatorGameSessionBufferingFollowups
            # copy buffer and reset
            opponentEventDataBuffer = games[gameId].spectatorOpponentEventDataBuffer.slice(0)
            games[gameId].spectatorOpponentEventDataBuffer.length = 0

            # broadcast whatever's in the buffer to the opponent
            _.each(opponentEventDataBuffer, (eventData) ->
              Logger.module("IO").debug "[G:#{gameId}]", "flushSpectatorNetworkEventBuffer() -> transmitting step #{eventData.step?.index?.toString().yellow} with action #{eventData.step.action?.name} to opponent's spectators"
              io.sockets.adapter.rooms.get("spectate-#{gameId}")?.forEach((socketId) ->
                socket = io.sockets.sockets.get(socketId)
                if socket? and socket.playerId != eventData.step.playerId
                  eventDataCopy = JSON.parse(JSON.stringify(eventData))
                  # always scrub steps for sensitive data from opponent's spectator perspective
                  UtilsGameSession.scrubSensitiveActionData(games[gameId].session, eventDataCopy.step.action, socket.playerId, true)
                  socket.emit EVENTS.network_game_event, eventDataCopy
              )
            )
        else
          io.to("spectate-#{gameId}").emit EVENTS.network_game_event, eventData

# NOTE: This function is duplicated in game/single_player in order to provide access to the global io.sockets object.
getConnectedSpectatorsDataForGamePlayer = (gameId,playerId)->
  spectators = []
  io.sockets.adapter.rooms.get("spectate-#{gameId}")?.forEach((socketId) ->
    socket = io.sockets.sockets.get(socketId)
    if socket.playerId == playerId
      spectators.push({
        id:socket.spectatorId,
        playerId:socket.playerId,
        username:socket.spectateToken?.u
      })
  )
  return spectators

# endregion SPECTATOR
