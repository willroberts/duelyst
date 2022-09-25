# Multi-Player Game Server
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
UtilsGameSession = require '../app/common/utils/utils_game_session.coffee'
config = require '../config/config'
shutdown = require './shutdown.coffee'

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
		secret: config.get('firebase.legacyToken'),
		timeout: 15000
	)
)
module.exports = io
server.listen config.get('game_port'), () ->
	Logger.module("GAME SERVER").log "GAME Server <b>#{os.hostname()}</b> started."

# the 'games' hash maps game IDs to References for those games
games = {}

# save some basic stats about this server into redis
playerCount = 0
gameCount = 0

# turn times
MAX_TURN_TIME = (CONFIG.TURN_DURATION + CONFIG.TURN_DURATION_LATENCY_BUFFER) * 1000.0
MAX_TURN_TIME_INACTIVE = (CONFIG.TURN_DURATION_INACTIVE + CONFIG.TURN_DURATION_LATENCY_BUFFER) * 1000.0

# error 'domain' to deal with io.sockets uncaught errors
d = require('domain').create()
d.on 'error', shutdown.errorShutdown
d.add(io.sockets)

# health ping on socket namespace /health
healthPing = io
	.of '/health'
	.on 'connection', (socket) ->
		socket.on 'ping', () ->
			Logger.module("GAME SERVER").debug "socket.io Health Ping"
			socket.emit 'pong'

# run main io.sockets inside of the domain
d.run () ->
	io.sockets.on "connection", (socket) ->
		# add the socket to the error domain
		d.add(socket)

		# Socket is now autheticated, continue to bind other handlers
		socket.decoded_token = socket.decodedToken # Socket.io 4.x compat
		Logger.module("IO").debug "DECODED TOKEN ID: #{socket.decoded_token.d.id.blue}"
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
		Logger.module("IO").debug "[G:#{@.gameId}]", "leave_game -> spectator #{@.spectatorId} leaving #{@.gameId}"
		Spectate.spectatorLeaveGameIfNeeded(@)
	else
		Logger.module("IO").debug "[G:#{@.gameId}]", "leave_game -> player #{@.playerId} leaving #{@.gameId}"
		GameLib.playerLeaveGameIfNeeded(@)

###
# Socket Disconnect Event Handler. Handles rollback if in the middle of followup etc.
# @public
###
onGameDisconnect = () ->
	if @.spectatorId
		# make spectator leave game room
		Spectate.spectatorLeaveGameIfNeeded(@)
		# remove the socket from the error domain, this = socket
		d.remove(@)

	else
		try
			io.sockets.adapter.rooms.get(@.gameId)?.forEach((socketId) ->
				socket = io.sockets.sockets.get(socketId)
				if socket.playerId == @.playerId
					Logger.module("IO").error "onGameDisconnect:: looks like the player #{@.playerId} we are trying to disconnect is still in the game #{@.gameId} room. ABORTING".red
					return
			)

			for clientId,socket of io.sockets.sockets
				if socket.playerId == @.playerId and not socket.spectatorId
					Logger.module("IO").error "onGameDisconnect:: looks like the player #{@.playerId} that allegedly disconnected is still alive and well.".red
					return

		catch error
			Logger.module("IO").error "onGameDisconnect:: Error #{error?.message}.".red

		# if we are in a buffering state
		# and the disconnecting player is in the middle of a followup
		gs = games[@gameId]?.session
		if gs? and gs.getIsBufferingEvents() and gs.getCurrentPlayerId() == @playerId
			# execute a rollback to reset server state
			# but do not send this action to the still connected player
			# because they do not care about rollbacks for the other player
			rollBackAction = gs.actionRollbackSnapshot()
			gs.executeAction(rollBackAction)

		# remove the socket from the error domain, this = socket
		d.remove(@)
		GameLib.savePlayerCount(--playerCount)
		Logger.module("IO").debug "[G:#{@.gameId}]", "disconnect -> #{@.playerId}".red

		# if a client is already in another game, leave it
		GameLib.playerLeaveGameIfNeeded(@)

###
# Clears timeout for disconnected players
# @public
# @param	{String}	gameId			The ID of the game to clear disconnected timeout for.
###
clearDisconnectedPlayerTimeout = (gameId) ->
	Logger.module("IO").debug "[G:#{gameId}]", "clearDisconnectedPlayerTimeout:: for game: #{gameId}".yellow
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
	Logger.module("IO").debug "[G:#{gameId}]", "startDisconnectedPlayerTimeout:: for #{playerId} in game: #{gameId}".yellow

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
	Logger.module("IO").debug "[G:#{gameId}]", "onDisconnectedPlayerTimeout:: #{playerId} for game: #{gameId}"

	io.sockets.adapter.rooms.get(gameId)?.forEach((socketId) ->
		socket = io.sockets.sockets.get(socketId)
		if socket.playerId == playerId
			Logger.module("IO").error "[G:#{gameId}]", "onDisconnectedPlayerTimeout:: looks like the player #{playerId} we are trying to disconnect is still in the game #{gameId} room. ABORTING".red
			return
	)

	for clientId,socket of io.sockets.sockets
		if socket.playerId == playerId and not socket.spectatorId
			Logger.module("IO").error "[G:#{gameId}]", "onDisconnectedPlayerTimeout:: looks like the player #{playerId} we are trying to disconnect is still connected but not in the game #{gameId} room.".red
			return

	# grab the relevant game session
	gs = games[gameId]?.session

	# looks like we timed out for a game that's since ended
	if !gs or gs?.status == SDK.GameStatus.over
		Logger.module("IO").error "[G:#{gameId}]", "onDisconnectedPlayerTimeout:: #{playerId} timed out for FINISHED or NULL game: #{gameId}".yellow
		return
	else
		Logger.module("IO").debug "[G:#{gameId}]", "onDisconnectedPlayerTimeout:: #{playerId} auto-resigning game: #{gameId}".yellow

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
						Logger.module("IO").debug "[G:#{gameId}]", "emitGameEvent -> transmitting step #{eventData.step?.index?.toString().yellow} with action #{eventData.step.action?.type} to origin"
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
		# TODO: this will break delayed game session, needs a recode
		game.spectatorOpponentEventDataBuffer.length = 0

###
# Subscribes to the gamesession's event bus.
# Can be called multiple times in order to re-subscribe.
# @public
# @param	{Object}		gameId			The game ID to subscribe for.
###
subscribeToGameSessionEvents = (gameId)->
	Logger.module("...").debug "[G:#{gameId}]", "subscribeToGameSessionEvents -> subscribing to GameSession events"
	game = games[gameId]
	if game?
		# unsubscribe from previous
		unsubscribeFromGameSessionEvents(gameId)

		# listen for game events
		game.session.getEventBus().on(EVENTS.before_rollback_to_snapshot, onBeforeRollbackToSnapshot)
		game.session.getEventBus().on(EVENTS.step, GameLib.onStep)
		game.session.getEventBus().on(EVENTS.invalid_action, GameLib.onInvalidAction)

###
# Unsubscribe from event listeners on the game session for this game ID.
# @public
# @param	{String}		gameId			The game ID that needs to be unsubscribed.
###
unsubscribeFromGameSessionEvents = (gameId)->
	Logger.module("...").debug "[G:#{gameId}]", "unsubscribeFromGameSessionEvents -> un-subscribing from GameSession events"
	game = games[gameId]
	if game?
		game.session.getEventBus().off(EVENTS.before_rollback_to_snapshot, onBeforeRollbackToSnapshot)
		game.session.getEventBus().off(EVENTS.step, GameLib.onStep)
		game.session.getEventBus().off(EVENTS.invalid_action, GameLib.onInvalidAction)

process.on "SIGTERM", GameLib.shutdownHandler
process.on "SIGINT",	GameLib.shutdownHandler
process.on "SIGHUP",	GameLib.shutdownHandler
process.on "SIGQUIT", GameLib.shutdownHandler
