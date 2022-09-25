Promise = require 'bluebird'
_ = require 'underscore'
io = require 'socket.io'
jwt = require 'jsonwebtoken'
moment = require 'moment'

EVENTS = require '../../app/common/event_types'
Logger = require '../../app/common/logger.coffee'
SDK = require '../../app/sdk.coffee'
UtilsGameSession = require '../../app/common/utils/utils_game_session.coffee'
config = require '../../config/config'

###
# start a spectator game session if one doesn't exist and call a completion handler when done
# @public
# @param	{Object}		gameId			The game ID to load.
# @param	{Function}		onComplete		Callback when done.
###
initSpectatorGameSession = (gameId)->
	if not games[gameId]
		return Promise.reject(new Error("This game is no longer in progress"))

	return Promise.resolve()
	.then ()->
		# if we're not already running spectate systems
		if not games[gameId].spectateIsRunning
			# mark that we are running spectate systems
			games[gameId].spectateIsRunning = true
			# if we're in the middle of a followup and we have some buffered events, we need to copy them over to the spectate buffer
			if games[gameId].session.getIsBufferingEvents() and games[gameId].opponentEventDataBuffer.length > 0
				games[gameId].spectatorOpponentEventDataBuffer.length = 0
				for eventData in games[gameId].opponentEventDataBuffer
					eventDataCopy = JSON.parse(JSON.stringify(eventData))
					games[gameId].spectatorOpponentEventDataBuffer.push(eventDataCopy)

		if games[gameId].spectateIsDelayed and not games[gameId].spectatorDelayedGameSession
			Logger.module("...").log "[G:#{gameId}]", "initSpectatorDelayedGameSession() -> creating delayed game session"

			# create
			delayedGameDataIn = games[gameId].session.serializeToJSON(games[gameId].session)
			delayedGameSession = SDK.GameSession.create()
			delayedGameSession.setIsRunningAsAuthoritative(false)
			delayedGameSession.deserializeSessionFromFirebase(JSON.parse(delayedGameDataIn))
			delayedGameSession.gameId = "SPECTATE:#{delayedGameSession.gameId}"
			games[gameId].spectatorDelayedGameSession = delayedGameSession
			# start timer to execute delayed / buffered spectator game events
			restartSpectatorDelayedGameInterval(gameId)
			return Promise.resolve(games[gameId].spectatorDelayedGameSession)
		else
			return Promise.resolve(games[gameId].session)

###
# socket handler for spectators joining game
# @public
# @param	{Object}	requestData	 Plain JS object with socket event data.
###
onGameSpectatorJoin = (requestData) ->
	# request parameters
	# TODO : Sanitize these parameters to prevent crash if gameId = null
	gameId = requestData.gameId
	spectatorId = requestData.spectatorId
	playerId = requestData.playerId
	spectateToken = null

	# verify - synchronous
	try
		spectateToken = jwt.verify(requestData.spectateToken, config.get('firebase.legacyToken'))
	catch error
		Logger.module("IO").error "[G:#{gameId}]", "spectate_game -> ERROR decoding spectate token: #{error?.message}".red

	if not spectateToken or spectateToken.b?.length == 0
		Logger.module("IO").error "[G:#{gameId}]", "spectate_game -> REFUSING JOIN: A specate token #{spectateToken} is not valid".red
		@emit "spectate_game_response",
			error:"Your spectate token is invalid, so we can't join you to the game."
		return

	Logger.module("IO").debug "[G:#{gameId}]", "spectate_game -> token contents: ", spectateToken.b
	Logger.module("IO").debug "[G:#{gameId}]", "spectate_game -> playerId: ", playerId

	if not _.contains(spectateToken.b,playerId)
		Logger.module("IO").error "[G:#{gameId}]", "spectate_game -> REFUSING JOIN: You do not have permission to specate this game".red
		@emit "spectate_game_response",
			error:"You do not have permission to specate this game."
		return

	# must have a spectatorId
	if not spectatorId
		Logger.module("IO").error "[G:#{gameId}]", "spectate_game -> REFUSING JOIN: A spectator #{spectatorId.blue} is not valid".red
		@emit "spectate_game_response",
			error:"Your login ID is blank (expired?), so we can't join you to the game."
		return

	# must have a playerId
	if not playerId
		Logger.module("IO").error "[G:#{gameId}]", "spectate_game -> REFUSING JOIN: A player #{playerId.blue} is not valid".red
		@emit "spectate_game_response",
			error:"Invalid player ID."
		return

	# must have a gameId
	if not gameId
		Logger.module("IO").error "[G:#{gameId}]", "spectate_game -> REFUSING JOIN: A gameId #{gameId.blue} is not valid".red
		@emit "spectate_game_response",
			error:"Invalid Game ID."
		return

	# if someone is trying to join a game they don't belong to as a player they are not authenticated as
	if @.decoded_token.d.id != spectatorId
		Logger.module("IO").error "[G:#{gameId}]", "spectate_game -> REFUSING JOIN: A player #{@.decoded_token.d.id.blue} is attempting to join a game as #{playerId.blue}".red
		@emit "spectate_game_response",
			error:"Your login ID does not match the one you requested to spectate the game with."
		return

	Logger.module("IO").debug "[G:#{gameId}]", "spectate_game -> spectator:#{spectatorId} is joining game:#{gameId}".cyan

	# if a client is already in another game, leave it
	spectatorLeaveGameIfNeeded(@)

	if games[gameId]?.connectedSpectators.length >= 10
		# max out at 10 spectators
		@emit "spectate_game_response",
			error:"Maximum number of spectators already watching."
		return

	# initialize a server-side game session and join it
	initSpectatorGameSession(gameId)
	.bind @
	.then (spectatorGameSession) ->
		# for spectators, use the delayed in-memory game session
		gameSession = spectatorGameSession

		Logger.module("IO").debug "[G:#{gameId}]", "spectate_game -> Got #{gameId} GameSession data.".cyan
		player = _.find(gameSession.players, (p) -> return p.playerId == playerId)
		opponent = _.find(gameSession.players, (p) -> return p.playerId != playerId)

		if not player
			# let the socket know we had an error
			@emit "spectate_game_response",
				error:"could not join game because the player id you requested could not be found"

			# destroy the game data loaded so far if the opponent can't be defined and no one else is connected
			Logger.module("IO").error "[G:#{gameId}]", "onGameSpectatorJoin -> DESTROYING local game cache due to join error".red
			destroyGameSessionIfNoConnectionsLeft(gameId)

			# stop any further processing
			return
		else
			# set some parameters for the socket
			@gameId = gameId
			@spectatorId = spectatorId
			@spectateToken = spectateToken
			@playerId = playerId

			# join game room
			@join("spectate-#{gameId}")

			# update user count for game room
			games[gameId].connectedSpectators.push(spectatorId)

			# prepare and scrub game session data for this player
			# if a followup is active and it isn't this player's followup, send them the rollback snapshot
			if gameSession.getIsFollowupActive() and gameSession.getCurrentPlayerId() != playerId
				gameSessionData = JSON.parse(gameSession.getRollbackSnapshotData())
			else
				gameSessionData = JSON.parse(gameSession.serializeToJSON(gameSession))
			UtilsGameSession.scrubGameSessionData(gameSession, gameSessionData, playerId, true)
			###
			# if the spectator does not have the opponent in their buddy list
			if not _.contains(spectateToken.b,opponent.playerId)
				# scrub deck data and opponent hand data by passing in opponent ID
				scrubGameSessionDataForSpectators(gameSession, gameSessionData, opponent.playerId)
			else
				# otherwise just scrub deck data in a way you can see both decks
				# scrubGameSessionDataForSpectators(gameSession, gameSessionData)
				# NOTE: above line is disabled for now since it does some UI jankiness since when a cardId is present the tile layer updates when the spectated opponent starts to select cards
				# NOTE: besides, actions will be scrubbed so this idea of watching both players only sort of works right now
				scrubGameSessionDataForSpectators(gameSession, gameSessionData, opponent.playerId, true)
			###
			# respond to client with success and a scrubbed copy of the game session
			@emit "spectate_game_response",
				message: "successfully joined game"
				gameSessionData: gameSessionData

			# broadcast to the game room that a spectator has joined
			@broadcast.to(gameId).emit("spectator_joined",{
				id: spectatorId,
				playerId: playerId,
				username: spectateToken.u
			})
	.catch (e) ->
		# if we didn't join a game, broadcast a failure
		@emit "spectate_game_response",
			error:"could not join game: #{e.message}"

###*
# Ticks the spectator delayed game and usually flushes the buffer by calling `flushSpectatorNetworkEventBuffer`.
# @public
# @param	{Object}		gameId			The game for which to iterate the time.
###
onSpectatorDelayedGameTick = (gameId) ->
	if not games[gameId]
		Logger.module("Game").debug "onSpectatorDelayedGameTick() -> game [G:#{gameId}] seems to be destroyed. Stopping ticks."
		stopSpectatorDelayedGameInterval(gameId)
		return

	_logSpectatorTickInfo(gameId)

	# flush anything in the spectator buffer
	flushSpectatorNetworkEventBuffer(gameId)

_logSpectatorTickInfo = _.debounce((gameId)->
	Logger.module("Game").debug "onSpectatorDelayedGameTick() ... #{games[gameId]?.spectatorGameEventBuffer?.length} buffered"
	if games[gameId]?.spectatorGameEventBuffer
		for eventData,i in games[gameId]?.spectatorGameEventBuffer
			Logger.module("Game").debug "onSpectatorDelayedGameTick() eventData: ",eventData
, 1000)

###*
# ...
# @public
# @param	{Object}		gameId			The game ID.
###
restartSpectatorDelayedGameInterval = (gameId) ->
	stopSpectatorDelayedGameInterval(gameId)
	Logger.module("IO").debug "[G:#{gameId}]", "restartSpectatorDelayedGameInterval"
	if games[gameId].spectateIsDelayed
		games[gameId].spectatorDelayTimer = setInterval((()-> onSpectatorDelayedGameTick(gameId)), 500)

###
# This function leaves a game for a spectator socket if the socket is connected to a game
# @public
# @param	{Socket}	socket		The socket which wants to leave a game.
###
spectatorLeaveGameIfNeeded = (socket) ->
	# if a client is already in another game
	if socket.gameId
		Logger.module("...").debug "[G:#{socket.gameId}]", "spectatorLeaveGameIfNeeded -> #{socket.spectatorId} leaving game #{socket.gameId}."

		# broadcast that you left
		socket.broadcast.to(socket.gameId).emit("spectator_left",{
			id:socket.spectatorId,
			playerId:socket.playerId,
			username:socket.spectateToken?.u
		})

		# leave specator game room
		socket.leave("spectate-#{socket.gameId}")
		Logger.module("...").debug "[G:#{socket.gameId}]", "spectatorLeaveGameIfNeeded -> #{socket.spectatorId} left room for game #{socket.gameId}."

		# update spectator count for game room
		if games[socket.gameId]
			games[socket.gameId].connectedSpectators = _.without(games[socket.gameId].connectedSpectators,socket.spectatorId)
			Logger.module("...").debug "[G:#{socket.gameId}]", "spectatorLeaveGameIfNeeded -> #{socket.spectatorId} removed from list of spectators #{socket.gameId}."

			# if no spectators left, stop the delayed game interval and destroy spectator delayed game session
			tearDownSpectateSystemsIfNoSpectatorsLeft(socket.gameId)

			# destroy game if no one is connected anymore
			destroyGameSessionIfNoConnectionsLeft(socket.gameId,true)

		remainingSpectators = games[socket.gameId]?.connectedSpectators?.length || 0
		Logger.module("...").debug "[G:#{socket.gameId}]", "spectatorLeaveGameIfNeeded -> #{socket.spectatorId} has left game #{socket.gameId}. remaining spectators #{remainingSpectators}"

		# finally clear the existing gameId
		socket.gameId = null

###*
# ...
# @public
# @param	{Object}		gameId			The game ID.
###
stopSpectatorDelayedGameInterval = (gameId) ->
	Logger.module("IO").debug "[G:#{gameId}]", "stopSpectatorDelayedGameInterval"
	clearInterval(games[gameId].spectatorDelayTimer)

###
# This function stops all spectate systems if 0 spectators left.
# @public
# @param	{String}	gameId		The ID of the game to tear down spectate systems.
###
tearDownSpectateSystemsIfNoSpectatorsLeft = (gameId)->
	# if no spectators left, stop the delayed game interval and destroy spectator delayed game session
	if games[gameId]?.connectedSpectators.length == 0
		Logger.module("IO").debug "[G:#{gameId}]", "tearDownSpectateSystemsIfNoSpectatorsLeft() -> no spectators left, stopping spectate systems"
		stopSpectatorDelayedGameInterval(gameId)
		games[gameId].spectatorDelayedGameSession = null
		games[gameId].spectateIsRunning = false
		games[gameId].spectatorOpponentEventDataBuffer.length = 0
		games[gameId].spectatorGameEventBuffer.length = 0

module.exports = {
	onGameSpectatorJoin,
	spectatorLeaveGameIfNeeded
}
