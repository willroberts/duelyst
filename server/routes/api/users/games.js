/* eslint-disable
    camelcase,
    import/extensions,
    max-len,
    no-param-reassign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const express = require('express');
const request = require('superagent');
const Promise = require('bluebird');
const t = require('tcomb-validation');
const _ = require('underscore');
const knex = require('../../../lib/data_access/knex');
const DataAccessHelpers = require('../../../lib/data_access/helpers');
const DecksModule = require('../../../lib/data_access/decks');
const Logger = require('../../../../app/common/logger');
const config = require('../../../../config/config');
const UtilsGameSession = require('../../../../app/common/utils/utils_game_session');
const GameSession = require('../../../../app/sdk/gameSession');
const Errors = require('../../../lib/custom_errors');
let Consul = require('../../../lib/consul');
const generatePushId = require('../../../../app/common/generate_push_id');
Consul = require('../../../lib/consul');

const router = express.Router();

router.get('/', (req, res, next) => {
  // user id is set by a middleware
  const {
    user_id,
  } = req;
  let {
    page,
  } = req.query;

  if (page == null) { page = 0; }

  Logger.module('API').debug(`loading games for page: ${page}`);

  return knex('user_games').where('user_id', user_id).orderBy('game_id', 'desc').offset(page * 10)
    .limit(10)
    .select()
    .then((rows) => {
      const playerFacingRows = _.map(rows, (row) => {
        row.digest = DecksModule.hashForDeck(row.deck_cards, user_id);
        row = _.omit(row, ['rating', 'rating_delta', 'is_bot_game', 'deck_cards', 'deck_id']);
        return row;
      });
      return res.status(200).json(DataAccessHelpers.restifyData(playerFacingRows));
    })
    .catch((error) => next(error));
});

router.get('/:game_id/replay_data', (req, res, next) => {
  const result = t.validate(req.params.game_id, t.subtype(t.Str, (s) => s.length <= 36));
  if (!result.isValid()) {
    return next();
  }

  // user id is set by a middleware
  const {
    user_id,
  } = req;
  const game_id = result.value;

  return knex('user_games').where('user_id', user_id).andWhere('game_id', game_id).first()
    .then((row) => {
      if (row != null) {
        const gameDataUrl = `https://s3-us-west-1.amazonaws.com/duelyst-games/${config.get('env')}/${game_id}.json`;
        const mouseUIDataUrl = `https://s3-us-west-1.amazonaws.com/duelyst-games/${config.get('env')}/ui_events/${game_id}.json`;
        Logger.module('API').debug(`starting download of game ${game_id} replay data from ${gameDataUrl}`);

        const downloadGameSessionDataAsync = new Promise((resolve, reject) => request.get(gameDataUrl).end((err, res) => {
          if ((res != null) && (res.status >= 400)) {
            // Network failure, we should probably return a more intuitive error object
            Logger.module('API').error(`ERROR! Failed to connect to games data: ${res.status} `.red);
            return reject(new Error('Failed to connect to games data.'));
          } if (err) {
            // Internal failure
            Logger.module('API').error(`ERROR! _retrieveGameSessionData() failed: ${err.message} `.red);
            return reject(err);
          }
          return resolve(res.text);
        }));

        const downloadMouseUIDataAsync = new Promise((resolve, reject) => request.get(mouseUIDataUrl).end((err, res) => {
          if ((res != null) && (res.status >= 400)) {
            // Network failure, we should probably return a more intuitive error object
            Logger.module('API').error(`ERROR! Failed to connect to ui event data: ${res.status} `.red);
            return reject(new Error('Failed to connect to ui event data.'));
          } if (err) {
            // Internal failure
            Logger.module('API').error(`ERROR! _retrieveGameUIEventData() failed: ${err.message} `.red);
            return reject(err);
          }
          return resolve(res.text);
        }));

        return Promise.all([
          downloadGameSessionDataAsync,
          downloadMouseUIDataAsync,
        ]);
      }
      return [null, null];
    })
    .spread((gameDataString, mouseUIDataString) => {
      Logger.module('API').debug(`downloaded game ${game_id} replay data. size:${(gameDataString != null ? gameDataString.length : undefined) || 0}`);
      if ((gameDataString == null) || (mouseUIDataString == null)) {
        return res.status(404).json({});
      }
      let gameSessionData = JSON.parse(gameDataString);
      const mouseUIData = JSON.parse(mouseUIDataString);

      // scrub the data here
      const gameSession = GameSession.create();
      gameSession.deserializeSessionFromFirebase(JSON.parse(gameDataString));
      gameSessionData = UtilsGameSession.scrubGameSessionData(gameSession, gameSessionData, user_id, true);

      return res.status(200).json({ gameSessionData, mouseUIData });
    })
    .catch((error) => next(error));
});

module.exports = router;
