/* eslint-disable
    camelcase,
    guard-for-in,
    max-len,
    no-param-reassign,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const express = require('express');
const t = require('tcomb-validation');
const moment = require('moment');
const knex = require('../../../lib/data_access/knex');
const DataAccessHelpers = require('../../../lib/data_access/helpers');
const Logger = require('../../../../app/common/logger');
const RankFactory = require('../../../../app/sdk/rank/rankFactory');
const RankDivisionLookup = require('../../../../app/sdk/rank/rankDivisionLookup');
const config = require('../../../../config/config');
const types = require('../../../validators/types');
const { SRankManager } = require('../../../redis');

const router = express.Router();

router.get('/current', (req, res, next) => {
  // user id is set by a middleware
  const {
    user_id,
  } = req;

  return knex('users').select('rank', 'rank_win_streak', 'rank_starting_at').where('id', user_id).first()
    .then((rankRow) => {
      rankRow.win_streak = rankRow.rank_win_streak;
      rankRow.starting_at = rankRow.rank_starting_at;
      delete rankRow.rank_win_streak;
      delete rankRow.rank_starting_at;
      rankRow = DataAccessHelpers.restifyData(rankRow);
      return res.status(200).json(rankRow);
    })
    .catch((error) => next(error));
});

router.get('/current_ladder_position', (req, res, next) => {
  const {
    user_id,
  } = req;

  const MOMENT_UTC_NOW = moment().utc();
  const startOfSeasonMonth = moment(MOMENT_UTC_NOW).utc().startOf('month');

  return SRankManager.getUserLadderPosition(user_id, startOfSeasonMonth)
    .then((userLadderPosition) => Promise.resolve({ ladder_position: userLadderPosition })).then((ladderData) => res.status(200).json(ladderData)).catch((error) => next(error));
});

router.get('/history', (req, res, next) => {
  // user id is set by a middleware
  const {
    user_id,
  } = req;

  return knex('user_rank_history').where('user_id', user_id).orderBy('starting_at', 'desc').limit(12)
    .select()
    .then((rankHistoryRows) => res.status(200).json(DataAccessHelpers.restifyData(rankHistoryRows)))
    .catch((error) => next(error));
});

router.get('/history/game_counters', (req, res, next) => {
  // user id is set by a middleware
  const {
    user_id,
  } = req;

  return knex('user_game_season_counters').where('user_id', user_id).andWhere('game_type', 'ranked').orderBy('season_starting_at', 'desc')
    .limit(12)
    .select()
    .then((rankHistoryRows) => res.status(200).json(DataAccessHelpers.restifyData(rankHistoryRows)))
    .catch((error) => next(error));
});

router.get('/history/:season_key/game_counter', (req, res, next) => {
  const result = t.validate(req.params.season_key, types.SeasonKey);
  if (!result.isValid()) {
    return next();
  }

  // user id is set by a middleware
  const {
    user_id,
  } = req;
  const season_key = result.value;
  const season_starting_at = moment(`${season_key} +0000`, 'YYYY-MM Z').utc();

  if (!season_starting_at.valueOf() > 0) {
    return res.status(400).json({});
  }

  return knex('user_game_season_counters').where('user_id', user_id).andWhere('game_type', 'ranked').andWhere('season_starting_at', season_starting_at.toDate())
    .first()
    .then((rankHistoryRow) => {
      if ((rankHistoryRow == null)) {
        // use empty default when no season counters exist
        // this can happen on new accounts that haven't played any games yet
        rankHistoryRow = {};
      }
      return res.status(200).json(DataAccessHelpers.restifyData(rankHistoryRow));
    })
    .catch((error) => next(error));
});

router.get('/top', (req, res, next) => {
  // user id is set by a middleware
  const {
    user_id,
  } = req;

  return knex('users').where('id', user_id).first('top_rank', 'top_rank_starting_at', 'top_rank_ladder_position')
    .then((rankRow) => {
      rankRow = DataAccessHelpers.restifyData(rankRow);
      return res.status(200).json(rankRow);
    })
    .catch((error) => next(error));
});

router.get('/division_stats', (req, res, next) => {
  // user id is set by a middleware
  const {
    user_id,
  } = req;

  return knex('user_rank_history').where('user_id', user_id).select()
    .then((rankHistoryRows) => {
      const stats = {};
      for (const rankKey in RankDivisionLookup) {
        const rankValue = RankDivisionLookup[rankKey];
        stats[rankKey] = { count: 0 };
      }
      for (const row of Array.from(rankHistoryRows)) {
        const divisionKey = RankFactory.rankedDivisionKeyForRank(row.rank);
        stats[divisionKey].count += 1;
      }
      return res.status(200).json(stats);
    })
    .catch((error) => next(error));
});

module.exports = router;
