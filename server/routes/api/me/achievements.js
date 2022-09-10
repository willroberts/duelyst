/* eslint-disable
    camelcase,
    import/no-unresolved,
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

const t = require('tcomb-validation');
const moment = require('moment');
const AchievementsModule = require('../../../lib/data_access/achievements');
const Logger = require('../../../../app/common/logger');
const DataAccessHelpers = require('../../../lib/data_access/helpers');

const knex = require('../../../lib/data_access/knex');

const WartechGeneralFaction1Achievement = require('../../../../app/sdk/achievements/wartechAchievements/wartechGeneralFaction1Achievement');
const WartechGeneralFaction2Achievement = require('../../../../app/sdk/achievements/wartechAchievements/wartechGeneralFaction2Achievement');
const WartechGeneralFaction3Achievement = require('../../../../app/sdk/achievements/wartechAchievements/wartechGeneralFaction3Achievement');
const WartechGeneralFaction4Achievement = require('../../../../app/sdk/achievements/wartechAchievements/wartechGeneralFaction4Achievement');
const WartechGeneralFaction5Achievement = require('../../../../app/sdk/achievements/wartechAchievements/wartechGeneralFaction5Achievement');
const WartechGeneralFaction6Achievement = require('../../../../app/sdk/achievements/wartechAchievements/wartechGeneralFaction6Achievement');

const router = express.Router();

router.put('/:achievement_id/read_at', (req, res, next) => {
  const result = t.validate(req.params.achievement_id, t.Str);
  if (!result.isValid()) {
    return res.status(400).json(result.errors);
  }

  const user_id = req.user.d.id;
  const achievement_id = result.value;

  return AchievementsModule.markAchievementAsRead(user_id, achievement_id)
    .then((value) => res.status(200).json(value)).catch((error) => {
      Logger.module('API').error(`${`Failed to mark achievement ${achievement_id} as read for ${user_id.blue}`.red} ERROR: ${error.message}`);
      return next(error);
    });
});

router.post('/login/', (req, res, next) => {
  const user_id = req.user.d.id;

  return AchievementsModule.updateAchievementsProgressWithLogin(user_id, moment.utc())
    .then((value) => res.status(200).json(value)).catch((error) => {
      Logger.module('API').error(`${`Failed to update login achievements for ${user_id.blue}`.red} ERROR: ${error.message}`);
      return next(error);
    });
});

router.get('/wartech_generals/progress', (req, res, next) => {
  const user_id = req.user.d.id;

  const userAchievementsColumns = ['user_id', 'achievement_id', 'progress', 'progress_required'];

  return Promise.all([
    knex('user_achievements').first(userAchievementsColumns).where('user_id', user_id).andWhere('achievement_id', WartechGeneralFaction1Achievement.id),
    knex('user_achievements').first(userAchievementsColumns).where('user_id', user_id).andWhere('achievement_id', WartechGeneralFaction2Achievement.id),
    knex('user_achievements').first(userAchievementsColumns).where('user_id', user_id).andWhere('achievement_id', WartechGeneralFaction3Achievement.id),
    knex('user_achievements').first(userAchievementsColumns).where('user_id', user_id).andWhere('achievement_id', WartechGeneralFaction4Achievement.id),
    knex('user_achievements').first(userAchievementsColumns).where('user_id', user_id).andWhere('achievement_id', WartechGeneralFaction5Achievement.id),
    knex('user_achievements').first(userAchievementsColumns).where('user_id', user_id).andWhere('achievement_id', WartechGeneralFaction6Achievement.id),
  ]).spread((userWartechAchievementRows) => {
    userWartechAchievementRows = DataAccessHelpers.restifyData(userWartechAchievementRows);
    return res.status(200).json(userWartechAchievementRows);
  }).catch((error) => {
    Logger.module('API').error(`${`Failed to retrieve general achievement progress for ${user_id.blue}`.red} ERROR: ${error.message}`);
    return next(error);
  });
});

module.exports = router;
