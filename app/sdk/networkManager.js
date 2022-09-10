/* eslint-disable
    consistent-return,
    func-names,
    implicit-arrow-linebreak,
    import/extensions,
    import/no-unresolved,
    max-classes-per-file,
    max-len,
    no-console,
    no-param-reassign,
    no-return-assign,
    no-undef,
    no-underscore-dangle,
    no-var,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const _ = require('underscore');
const io = require('socket.io-client');
const EventBus = require('app/common/eventbus');
const EVENTS = require('app/common/event_types');
const Logger = require('app/common/logger');
const CONFIG = require('app/common/config');
const Storage = require('app/common/storage');
const GameSession = require('./gameSession');
const ApplyCardToBoardAction = require('./actions/applyCardToBoardAction');

var NetworkManager = (function () {
  let instance;
  let _NetworkManager;
  NetworkManager = class NetworkManager {
    static initClass() {
      instance = null;

      _NetworkManager = class _NetworkManager {
        static initClass() {
          this.prototype.connected = false;
          this.prototype.disconnected = true;
          this.prototype.firebaseURL = process.env.FIREBASE_URL;
          this.prototype.gameId = null;
          this.prototype.playerId = null;
          this.prototype.spectatorId = null;
          this.prototype.spectateToken = null;
          this.prototype.gameRef = null;
          this.prototype.socket = null;
          this.prototype.socketManager = null;
          this.prototype.isOpponentConnected = null;
          this.prototype.spectators = null;
          this.prototype._eventBus = null;
          this.prototype._emitEventsAfterTimestamp = null;
          this.prototype._connectionCheckTimeout = null;
        }

        // NetworkManager is a singleton
        // Constructor only called once
        constructor() {
          Logger.module('SDK').debug('NetworkManager::new');
          this._eventBus = EventBus.create();
          this.spectators = new Backbone.Collection();
        }

        getEventBus() {
          return this._eventBus;
        }

        // connect to a specific game
        // TODO: modify to opts and pass in jwt token for auth
        connect(gameId, playerId, gameServerAddress, spectatorId = null, spectateToken = null) {
          if (this.connected) {
            Logger.module('SDK').warn('NetworkManager already connected.');
            return;
          }

          Logger.module('SDK').debug(`NetworkManager:connect -> gameId: ${gameId}`);
          this.gameId = gameId;
          this.playerId = `${playerId}`;
          this.spectatorId = spectatorId;
          this.spectateToken = spectateToken;
          this.isOpponentConnected = undefined;
          this._emitEventsAfterTimestamp = Date.now();
          this.spectators = new Backbone.Collection();

          TelemetryManager.getInstance().setSignal('game', 'connecting');

          // connect using socket.io manager
          // if no game server address was provided, connect to the current host
          if ((gameServerAddress == null)) {
            Logger.module('SDK').debug(`NetworkManager:connecting to dev server ${gameServerAddress}`);
            this.socketManager = new io.Manager(`${window.location.hostname}:8000`, {
              auth: { token: `Bearer ${Storage.get('token')}` }, timeout: 20000, reconnection: false, reconnectionDelay: 500, reconnectionDelayMax: 5000, reconnectionAttempts: 1,
            });
          } else {
            this.socketManager = new io.Manager(`wss://${gameServerAddress}`, {
              auth: { token: `Bearer ${Storage.get('token')}` }, timeout: 20000, reconnection: true, reconnectionDelay: 500, reconnectionDelayMax: 5000, reconnectionAttempts: 20,
            });
          }
          // Connect to a specific socket on the host, currently /
          this.socket = this.socketManager.socket('/', { forceNew: true });

          // When the socket opens, send the token for authetication
          this.socket.on('connect', (socket) => {});
          // Storage = require 'app/common/storage'
          // token = Storage.get('token')
          // @emit('authenticate', {token: token})

          // when you receive a message that the connection is ready (happens after authentication)
          this.socket.on('connected', (response) => { // fat arrow to bind this
            Logger.module('IO').log('NetworkManager::IO:connected -> SUCCESS');
            Logger.module('IO').log(`NetworkManager::IO:connected -> ${response.message}`);
            NetworkManager.getInstance().connected = true;
            NetworkManager.getInstance().disconnected = false;
            if (this.spectatorId) {
              return NetworkManager.getInstance().joinGameSpectatorRoom();
            }
            return NetworkManager.getInstance().joinGameRoom();
          });

          this.socket.on('connect_error', (error) => Logger.module('IO').error('NetworkManager::IO:connect_error', error));

          this.socket.on('reconnecting', (attempts) => {
            Logger.module('IO').log(`NetworkManager::IO:reconnecting attempt number ${attempts}`);
            return NetworkManager.getInstance().getEventBus().trigger(EVENTS.reconnect_to_game, NetworkManager.getInstance().gameId);
          });

          // BUG (socket.io) ? : This event may get triggered twice
          this.socket.on('reconnect_failed', () => {
            Logger.module('IO').log('NetworkManager::IO:reconnect failed');
            return NetworkManager.getInstance().getEventBus().trigger(EVENTS.reconnect_failed);
          });

          this.socket.on('join_game_response', (response) => {
            NetworkManager.getInstance().getEventBus().trigger(EVENTS.join_game, response);
            if (response.error) {
              Logger.module('IO').warn(`NetworkManager::IO:join_game_response ERROR -> ${response.error}`);
              return NetworkManager.getInstance().disconnect();
            }
            Logger.module('IO').log(`NetworkManager::IO:join_game_response -> ${response}`);
            const isOpponentAlreadyConnected = _.find(response.connectedPlayers, (playerId) => playerId !== NetworkManager.getInstance().playerId);
            if (isOpponentAlreadyConnected != null) {
              NetworkManager.getInstance().isOpponentConnected = true;
              NetworkManager.getInstance().getEventBus().trigger(EVENTS.opponent_connection_status_changed, { playerId, isConnected: true });
            }

            NetworkManager.getInstance().spectators.add(response.connectedSpectators);

            TelemetryManager.getInstance().clearSignal('game', 'connecting');
            return TelemetryManager.getInstance().setSignal('game', 'in-net-game');
          });

          this.socket.on('spectate_game_response', (response) => {
            NetworkManager.getInstance().getEventBus().trigger(EVENTS.spectate_game, response);
            if (response.error) {
              Logger.module('IO').warn(`NetworkManager::IO:join_game_response ERROR -> ${response.error}`);
              return NetworkManager.getInstance().disconnect();
            }
            Logger.module('IO').log(`NetworkManager::IO:join_game_response -> ${response}`);

            NetworkManager.getInstance().isOpponentConnected = true;
            NetworkManager.getInstance().getEventBus().trigger(EVENTS.opponent_connection_status_changed, { playerId, isConnected: true });

            TelemetryManager.getInstance().clearSignal('game', 'connecting');
            return TelemetryManager.getInstance().setSignal('game', 'in-net-game');
          });

          //  when a game event is received
          this.socket.on(EVENTS.network_game_event, (eventData, callback) => {
            Logger.module('IO').log(`NetworkManager::IO:network_game_event -> ${eventData}`);

            // defer the execution of the network step until the next stack call so that socket.io does not gobble up the error
            return _.defer(() => NetworkManager.getInstance().getEventBus().trigger(EVENTS.network_game_event, eventData));
          });

          //  when a player joins the game
          this.socket.on('player_joined', (playerId, callback) => {
            Logger.module('IO').log(`NetworkManager::IO:player_joined -> ${playerId}`);
            if ((playerId !== NetworkManager.getInstance().playerId) && !NetworkManager.getInstance().isOpponentConnected) {
              NetworkManager.getInstance().isOpponentConnected = true;
              return NetworkManager.getInstance().getEventBus().trigger(EVENTS.opponent_connection_status_changed, { playerId, isConnected: true });
            }
          });

          //  when a player joins the game
          this.socket.on('player_left', (playerId, callback) => {
            Logger.module('IO').log(`NetworkManager::IO:player_left -> ${playerId}`);
            if ((playerId !== NetworkManager.getInstance().playerId) && NetworkManager.getInstance().isOpponentConnected) {
              NetworkManager.getInstance().isOpponentConnected = false;
              return NetworkManager.getInstance().getEventBus().trigger(EVENTS.opponent_connection_status_changed, { playerId, isConnected: false });
            }
          });

          //  when a spectator joins the game
          this.socket.on('spectator_joined', (spectatorData, callback) => {
            Logger.module('IO').log(`NetworkManager::IO:spectator_joined -> ${spectatorData.username}`);
            NetworkManager.getInstance().spectators.add(spectatorData);
            return NetworkManager.getInstance().getEventBus().trigger(EVENTS.spectator_joined, spectatorData);
          });

          //  when a spectator joins the game
          this.socket.on('spectator_left', (spectatorData, callback) => {
            Logger.module('IO').log(`NetworkManager::IO:spectator_left -> ${spectatorData.username}`);
            NetworkManager.getInstance().spectators.remove(spectatorData.id);
            return NetworkManager.getInstance().getEventBus().trigger(EVENTS.spectator_left, spectatorData);
          });

          // when a game error is received
          this.socket.on(EVENTS.network_game_error, (errorData, callback) => {
            Logger.module('IO').warn(`NetworkManager::IO:network_game_error -> ${errorData}`);
            NetworkManager.getInstance().disconnect();
            return NetworkManager.getInstance().getEventBus().trigger(EVENTS.network_game_error, errorData);
          });

          // when a game server error is received
          this.socket.on('game_server_shutdown', (errorData, callback) => {
            Logger.module('IO').warn(`NetworkManager::IO:game_server_shutdown -> ${errorData.msg}`);
            return NetworkManager.getInstance().getEventBus().trigger(EVENTS.game_server_shutdown, errorData);
          });

          // when a game close event is received, usually after an error
          this.socket.on('close_game', (callback) => {
            Logger.module('IO').warn('NetworkManager::IO:close');
            return NetworkManager.getInstance().disconnect();
          });

          // when the socket disconnects
          return this.socket.on('disconnect', (err) => {
            console.log(err);
            Logger.module('IO').warn('NetworkManager::IO:disconnect -> DISCONNECT');
            NetworkManager.getInstance().connected = false;
            NetworkManager.getInstance().disconnected = true;

            TelemetryManager.getInstance().clearSignal('game', 'connecting');
            return TelemetryManager.getInstance().clearSignal('game', 'in-net-game');
          });
        }

        joinGameRoom() {
          Logger.module('SDK').debug('NetworkManager:joinGameRoom');
          if (this.socket && this.socket.connected) {
            return this.socket.emit('join_game', {
              playerId: this.playerId,
              gameId: this.gameId,
            });
          }
        }

        joinGameSpectatorRoom() {
          Logger.module('SDK').debug('NetworkManager:joinGameSpectatorRoom');
          if (this.socket && this.socket.connected) {
            return this.socket.emit('spectate_game', {
              spectatorId: this.spectatorId,
              spectateToken: this.spectateToken,
              playerId: this.playerId,
              gameId: this.gameId,
            });
          }
        }

        // Reconnect helper, call with new address
        reconnect(newServerAddress) {
          Logger.module('SDK').debug('NetworkManager:reconnect');
          this.socket.io.reconnection(false);
          this.socket.disconnect();
          return setTimeout(
            () => this.connect(this.gameId, this.playerId, newServerAddress),
            1000,
          );
        }

        disconnect() {
          Logger.module('SDK').debug('NetworkManager:disconnect');
          if (this.connected) {
            this.gameId = null;
          }

          if (this.socket) {
            // BUG (socket.io) : reconnection(false) doesn't work as expected
            this.socket.io.reconnection(false);
            return this.socket.disconnect();
          }
        }

        broadcastGameEvent(eventData) {
          const gameSession = GameSession.getInstance();

          // don't broadcast anything if we're a specator or running locally
          if (this.spectatorId || gameSession.getIsSpectateMode() || gameSession.getIsRunningAsAuthoritative()) {
            return false;
          }

          let validForBroadcast = (eventData != null) && (this.socket != null) && this.socket.connected && !gameSession.getIsRunningAsAuthoritative();
          if (validForBroadcast) {
            // Logger.module("APPLICATION").log("NetworkManager.broadcastGameEvent", eventData)
            // process data by event type
            const {
              type,
            } = eventData;
            if (type === EVENTS.step) {
              const {
                step,
              } = eventData;
              // always flag step as transmitted
              const transmitted = step.getTransmitted();
              step.setTransmitted(true);
              // steps are only valid when they belong to my player and haven't been transmitted
              validForBroadcast = (step != null) && (step.playerId === gameSession.getMyPlayerId()) && !transmitted;
              if (validForBroadcast) {
                // serialize step in the event data being broadcast
                eventData.step = JSON.parse(gameSession.serializeToJSON(step));
              }
            }

            if (validForBroadcast) {
              this.socket.emit(EVENTS.network_game_event, eventData, (data) => // TODO: implement the validation on the server
                Logger.module('SDK').debug('NetworkManager.broadcastGameEvent -> validated server got the message'));
            }
          }

          return validForBroadcast;
        }
      };
      _NetworkManager.initClass();
    }

    static getInstance() {
      return instance != null ? instance : (instance = new _NetworkManager());
    }
  };
  NetworkManager.initClass();
  return NetworkManager;
}());

module.exports = NetworkManager;
