/* eslint-disable
    camelcase,
    func-names,
    guard-for-in,
    import/extensions,
    max-len,
    no-continue,
    no-lonely-if,
    no-mixed-spaces-and-tabs,
    no-param-reassign,
    no-restricted-syntax,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const moment = require('moment');
const Promise = require('bluebird');
const _ = require('underscore');
const { GameManager } = require('../redis');
const CONFIG = require('../../app/common/config');
const Logger = require('../../app/common/logger');
const generatePushId = require('../../app/common/generate_push_id');
const config = require('../../config/config');
const { version } = require('../../version');

// sdk
const GameSetup = require('../../app/sdk/gameSetup');
const GameType = require('../../app/sdk/gameType');
const GameStatus = require('../../app/sdk/gameStatus');
const GameSession = require('../../app/sdk/gameSession');
const GameFormat = require('../../app/sdk/gameFormat');
const Factions = require('../../app/sdk/cards/factionsLookup');
const FactionFactory = require('../../app/sdk/cards/factionFactory');
const Cards = require('../../app/sdk/cards/cardsLookupComplete');

// ai
const UsableDecks = require('../ai/decks/usable_decks');

const GamesModule = require('./data_access/games');
const DuelystFirebase = require('./duelyst_firebase_module');
const FirebasePromises = require('./firebase_promises');
const knex = require('./data_access/knex');
const Errors = require('./custom_errors');
const Consul = require('./consul');

const createSinglePlayerGame = function (userId, name, gameType, deck, cardBackId, battleMapIndexesToSampleFrom, aiPlayerId, aiUsername, aiGeneralId, aiDeckId, aiDifficulty, aiNumRandomCards, ticketId, gameSetupOptions) {
  if ((gameType == null)) { gameType = GameType.SinglePlayer; }

  let playerIsPlayer1 = true;

  let getSinglePlayerStatusPromise = Promise.resolve({ enabled: false });

  Logger.module('SINGLE PLAYER').debug('deck:', deck);
  Logger.module('SINGLE PLAYER').debug('ticketId:', ticketId);

  if (config.get('consul.enabled')) {
    getSinglePlayerStatusPromise =			Consul.kv.get(`environments/${process.env.NODE_ENV}/single-player-status.json`)
			  .then(JSON.parse);
  } else {
    Logger.module('SINGLE PLAYER').debug('No need to check single player stack status since no CONSUL in environment.'.cyan);
    getSinglePlayerStatusPromise = Promise.resolve({ enabled: true });
  }

  const MOMENT_NOW_UTC = moment.utc();

  return getSinglePlayerStatusPromise
    .bind({})
    .then((matchmakingStatus) => {
      // matchmakingEnabled is currently a string
      if (matchmakingStatus.enabled) {
        Logger.module('SINGLE PLAYER').debug('SINGLE PLAYER status is active'.cyan);
        return true;
      }
      Logger.module('SINGLE PLAYER').debug('SINGLE PLAYER status is inactive'.red);
      throw new Errors.SinglePlayerModeDisabledError('Single Player mode is temporarily disabled.');
    }).then(() => {
      let eventValidationPromise = null;
      if (gameType !== GameType.BossBattle) {
        eventValidationPromise = Promise.resolve();
      } else {
        eventValidationPromise = DuelystFirebase.connect().getRootRef()
          .then((fbRootRef) => {
            const bossEventsRef = fbRootRef.child('boss-events');
            return FirebasePromises.once(bossEventsRef, 'value');
          }).then((bossEventsSnapshot) => {
            const bossEventsData = bossEventsSnapshot.val();

            let matchingEventData = null;
            for (const eventId in bossEventsData) {
              const eventData = bossEventsData[eventId];
              if (eventData.boss_id !== aiGeneralId) {
                continue;
              }
              if (eventData.event_start > MOMENT_NOW_UTC.valueOf()) {
                continue;
              }
              if (eventData.valid_end < MOMENT_NOW_UTC.valueOf()) {
                continue;
              }

              // Reaching here means we have a matching event
              matchingEventData = eventData;
              const matchingEventId = eventData.event_id;
              break;
            }

            if ((matchingEventData == null)) {
              throw new Errors.BossEventNotFound('No active event found for boss.');
            }
          });
      }

      return eventValidationPromise;
    }).then(function () {
      // get ai deck
      let aiDeck; let startingOrderAI; let startingOrderPlayer; let tmp; let
        withoutManaTiles;
      if (aiDeckId != null) {
        aiDeck = UsableDecks.getUsableDeckForIdentifier(aiGeneralId, aiDeckId);
      } else {
        aiDeck = UsableDecks.getAutomaticUsableDeck(aiGeneralId, aiDifficulty, aiNumRandomCards);
      }

      // generate players data
      let player1DataForGame = {
        userId,
        name,
        deck,
        cardBackId,
        ticketId,
        battleMapIndexes: battleMapIndexesToSampleFrom,
      };

      let player2DataForGame = {
        userId: aiPlayerId,
        name: aiUsername,
        deck: aiDeck,
      };

      // merge in any custom game setup options
      if (gameSetupOptions != null) {
        ({
          withoutManaTiles,
        } = gameSetupOptions);

        // parse player options
        const playerOptions = gameSetupOptions.player;
        if (playerOptions != null) {
          startingOrderPlayer = (playerOptions.startingOrder != null) ? playerOptions.startingOrder : 0;
          player1DataForGame = _.extend(player1DataForGame, playerOptions);
        }

        // parse ai options
        const aiOptions = gameSetupOptions.ai;
        if (aiOptions != null) {
          startingOrderAI = (aiOptions.startingOrder != null) ? aiOptions.startingOrder : 0;
          player2DataForGame = _.extend(player2DataForGame, aiOptions);
        }
      }

      if ((startingOrderAI != null) && (startingOrderAI > 0)) {
        // ai has a fixed starting order
        if (startingOrderAI === 1) {
          playerIsPlayer1 = false;
          tmp = player1DataForGame;
          player1DataForGame = player2DataForGame;
          player2DataForGame = tmp;
        }
      } else if ((startingOrderPlayer != null) && (startingOrderPlayer > 0)) {
        // player has a fixed starting order
        if (startingOrderPlayer === 2) {
          playerIsPlayer1 = false;
          tmp = player1DataForGame;
          player1DataForGame = player2DataForGame;
          player2DataForGame = tmp;
        }
      } else {
        // make it random who goes first
        if (Math.random() >= 0.5) {
          playerIsPlayer1 = false;
          tmp = player1DataForGame;
          player1DataForGame = player2DataForGame;
          player2DataForGame = tmp;
        }
      }

      // create GameSession
      this.newGameSession = GameSession.create();
      this.newGameSession.gameType = gameType;
      this.newGameSession.gameFormat = GameFormat.Legacy;
      this.newGameSession.version = version;
      this.newGameSession.setIsRunningAsAuthoritative(true);
      GameSetup.setupNewSession(this.newGameSession, player1DataForGame, player2DataForGame, withoutManaTiles);

      // set ai properties for later retrieval by ai
      this.newGameSession.setAiPlayerId(aiPlayerId);
      this.newGameSession.setAiDifficulty(aiDifficulty);

      // generate game id
      return GameManager.generateGameId();
    })
    .then(function (gameId) { // save game to redis
      this.gameId = gameId;
      Logger.module('SINGLE-PLAYER').debug(`New Game ID: ${gameId}`);
      this.newGameSession.gameId = gameId;
      return GameManager.saveGameSession(gameId, this.newGameSession.serializeToJSON(this.newGameSession));
    })
    .then(() => { // assign the player to a server
      // if consul is disabled, there's no need for a game server IP
      if (!config.get('consul.enabled')) {
        Logger.module('SINGLE PLAYER').debug('Not assigning to specific server since no CONSUL in environment.'.cyan);
        return Promise.resolve(null);
      }

      return Consul.getHealthySinglePlayerServers()
        .then((servers) => {
          if (servers.length === 0) {
            return Promise.reject(new Error('No servers available.'));
          }
          // Grab random node from available servers
          const random_node = _.sample(servers);
          const node_name = random_node.Node != null ? random_node.Node.Node : undefined;
          return Consul.kv.get(`nodes/${node_name}/dns_name`)
            .then((dns_name) => {
              Logger.module('SINGLE PLAYER').debug(`Connecting player to ${dns_name}`.green);
              return dns_name;
            });
        });
    })
    .then(function (gameServer) {
      let myGeneral; let myPlayerSetupData; let opponentGeneral; let
        opponentSetupData;
      const createdDate = moment().utc().valueOf();
      this.newGameSession.createdAt = createdDate;
      this.newGameSession.gameServer = gameServer;

      if (playerIsPlayer1) {
        myGeneral = this.newGameSession.getGeneralForPlayer1();
        myPlayerSetupData = this.newGameSession.getPlayer1SetupData();
        opponentGeneral = this.newGameSession.getGeneralForPlayer2();
        opponentSetupData = this.newGameSession.getPlayer2SetupData();
      } else {
        myGeneral = this.newGameSession.getGeneralForPlayer2();
        myPlayerSetupData = this.newGameSession.getPlayer2SetupData();
        opponentGeneral = this.newGameSession.getGeneralForPlayer1();
        opponentSetupData = this.newGameSession.getPlayer1SetupData();
      }

      // set up game data to save
      const gameData = {
        game_type: gameType,
        game_id: this.gameId,
        is_player_1: playerIsPlayer1,
        opponent_username: aiUsername,
        opponent_id: aiPlayerId,
        opponent_faction_id: opponentSetupData.factionId,
        opponent_general_id: opponentGeneral.getId(),
        status: GameStatus.active,
        created_at: createdDate,
        faction_id: myPlayerSetupData.factionId,
        general_id: myGeneral.getId(),
        game_server: gameServer,
        game_version: version,
        deck_cards: _.map(deck, (c) => c.id),
        rift_ticket_id: ticketId || null,
      };

      // response data to send back to the REST client
      this.responseData = {
        game_type: gameType,
        game_id: this.gameId,
        is_player_1: playerIsPlayer1,
        opponent_username: aiUsername,
        opponent_id: aiPlayerId,
        opponent_faction_id: opponentSetupData.factionId,
        opponent_general_id: opponentGeneral.getId(),
        status: GameStatus.active,
        created_at: createdDate,
        faction_id: myPlayerSetupData.factionId,
        general_id: myGeneral.getId(),
        game_server: gameServer,
        game_version: version,
        rift_ticket_id: ticketId || null,
      };

      // ...
      return GamesModule.newUserGame(userId, this.gameId, gameData);
    })
    .then(function () { // send data back to the player
      return this.responseData;
    });
};

module.exports = createSinglePlayerGame;
