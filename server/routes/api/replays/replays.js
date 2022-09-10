/* eslint-disable
    camelcase,
    func-names,
    import/no-unresolved,
    max-len,
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
const Logger = require('../../../../app/common/logger');
const config = require('../../../../config/config');
const UtilsGameSession = require('../../../../app/common/utils/utils_game_session');
const GameSession = require('../../../../app/sdk/gameSession');
const Errors = require('../../../lib/custom_errors');
const generatePushId = require('../../../../app/common/generate_push_id');

const router = express.Router();

router.get('/:replay_id', (req, res, next) => {
  const result = t.validate(req.params.replay_id, t.subtype(t.Str, (s) => s.length <= 36));
  if (!result.isValid()) {
    return next();
  }

  const replay_id = result.value;

  return knex('user_replays').where('replay_id', replay_id).first()
    .bind({})
    .then(function (replayData) {
      this.replayData = replayData;
      if (replayData != null) {
        const {
          game_id,
        } = replayData;
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
    .spread(function (gameDataString, mouseUIDataString) {
      Logger.module('API').debug(`downloaded replay id: ${replay_id} data. size:${(gameDataString != null ? gameDataString.length : undefined) || 0}`);
      if ((gameDataString == null) || (mouseUIDataString == null)) {
        return res.status(404).json({});
      }
      let gameSessionData = JSON.parse(gameDataString);
      const mouseUIData = JSON.parse(mouseUIDataString);

      // scrub the data here
      const gameSession = GameSession.create();
      gameSession.deserializeSessionFromFirebase(JSON.parse(gameDataString));
      Logger.module('API').debug(`scrubbing replay from perspective of ${this.replayData.user_id}`);
      gameSessionData = UtilsGameSession.scrubGameSessionData(gameSession, gameSessionData, this.replayData.user_id, true);

      return res.status(200).json({
        gameSessionData,
        mouseUIData,
        replayData: this.replayData,
      });
    })
    .catch((error) => next(error));
});

module.exports = router;
