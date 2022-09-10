/* eslint-disable
    camelcase,
    implicit-arrow-linebreak,
    import/extensions,
    max-len,
    no-param-reassign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const express = require('express');
const util = require('util');
const t = require('tcomb-validation');
const QuestsModule = require('../../../lib/data_access/quests');
const knex = require('../../../lib/data_access/knex');
const DataAccessHelpers = require('../../../lib/data_access/helpers');
const Logger = require('../../../../app/common/logger');
const Errors = require('../../../lib/custom_errors');

const router = express.Router();

router.get('/', (req, res, next) => {
  const user_id = req.user.d.id;

  return knex('user_quests').where('user_id', user_id).select()
    .then((questRows) => {
      questRows = DataAccessHelpers.restifyData(questRows);
      return res.status(200).json(questRows);
    })
    .catch((error) => next(error));
});

router.post('/beginner', (req, res, next) => {
  const user_id = req.user.d.id;

  return QuestsModule.generateBeginnerQuests(user_id)
    .then((value) => // all good, send the quests over
      res.status(200).json(value)).catch(Errors.NoNeedForNewBeginnerQuestsError, (e) => res.status(304).json({})).catch((error) => {
      // oops, looks like we have an error
      Logger.module('API').debug(`${`BEGINNER quests failed to generate for ${user_id.blue}`.red} ERROR: ${util.inspect(error)}`);
      return next(error);
    });
});

router.post('/daily', (req, res, next) => {
  const user_id = req.user.d.id;

  return QuestsModule.needsDailyQuests(user_id)
    .then((value) => {
      // check if we need to update daily quests
      if (!value) {
        Logger.module('API').debug(`DAILY quests are still less than a day old for ${user_id.blue}`);
        return res.status(304).json({});
      }
      Logger.module('API').debug(`Generating DAILY quests for ${user_id.blue}`.magenta);
      return QuestsModule.generateDailyQuests(user_id)
        .then((value) => {
          // all good, send the quests over
          Logger.module('API').debug(`DAILY quests GENERATED for ${user_id.blue}`.cyan);
          return res.status(200).json(value);
        }).catch(Errors.FirebaseTransactionDidNotCommitError, (error) => {
          Logger.module('API').debug(`DAILY quests did not need to update for ${user_id.blue}`);
          return res.status(304).json({});
        }).catch((error) => {
          // oops, looks like we have an error
          Logger.module('API').debug(`${`DAILY quests failed to generate for ${user_id.blue}`.red} ERROR: ${util.inspect(error)}`);
          return next(error);
        });
    }).catch((error) => {
      Logger.module('API').debug(`${`Failed to detect if we need daily quests for ${user_id.blue}`.red} ERROR: ${util.inspect(error)}`);
      return next(error);
    });
});

router.put('/daily/:quest_index', (req, res, next) => {
  const result = t.validate(parseInt(req.params.quest_index, 10), t.Number);
  if (!result.isValid()) {
    return next();
  }

  const user_id = req.user.d.id;
  const quest_index = result.value;

  Logger.module('API').debug(`Mulligan DAILY quest ${quest_index} for ${user_id.blue}`.magenta);
  return QuestsModule.mulliganDailyQuest(user_id, quest_index)
    .then((value) => {
      // all good, send the quests over
      Logger.module('API').debug(`DAILY quest ${quest_index} MULLIGANED for ${user_id.blue}`.cyan);
      return res.status(200).json(value);
    }).catch(Errors.QuestCantBeMulliganedError, (error) => {
      Logger.module('API').debug(`DAILY quest ${quest_index} can't be MULLIGANED again today for ${user_id.blue}`.yellow);
      return res.status(304).json({ message: 'quest already mulliganed' });
    }).catch((error) => {
      // oops, looks like we have an error
      Logger.module('API').debug(`${`DAILY quest ${quest_index} failed to mulligan for ${user_id.blue}`.red} ERROR: ${util.inspect(error)}`);
      return next(error);
    });
});

module.exports = router;
