/* eslint-disable
    camelcase,
    import/no-unresolved,
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
const knex = require('../../../lib/data_access/knex');
const DataAccessHelpers = require('../../../lib/data_access/helpers');
const Logger = require('../../../../app/common/logger');

const router = express.Router();

router.get('/games/:game_type', (req, res, next) => {
  const result = t.validate(req.params.game_type, t.Str);
  if (!result.isValid()) {
    return next();
  }

  const user_id = req.user.d.id;
  const game_type = result.value;

  return knex('user_game_counters').where({ user_id, game_type }).first()
    .then((statsRow) => {
      if (statsRow) {
        return res.status(200).json(DataAccessHelpers.restifyData(statsRow));
      }
      return res.status(200).json({});
    })
    .catch((error) => next(error));
});

router.get('/games/:game_type/factions/:faction_id', (req, res, next) => {
  const result = t.validate({
    game_type: req.params.game_type,
    faction_id: parseInt(req.params.faction_id, 10),
  }, t.struct({
    game_type: t.Str,
    faction_id: t.Number,
  }));
  if (!result.isValid()) {
    return next();
  }

  const user_id = req.user.d.id;
  const {
    game_type,
  } = result.value;
  const {
    faction_id,
  } = result.value;

  return knex('user_game_faction_counters').where({ user_id, game_type, faction_id }).first()
    .then((statsRow) => {
      if (statsRow) {
        return res.status(200).json(DataAccessHelpers.restifyData(statsRow));
      }
      return res.status(200).json({});
    })
    .catch((error) => next(error));
});

router.get('/gauntlet_runs/top/win_count', (req, res, next) => {
  const user_id = req.user.d.id;

  return knex('users').where({ id: user_id }).first('top_gauntlet_win_count')
    .then((statsRow) => {
      if (statsRow) {
        return res.status(200).json({ win_count: statsRow.top_gauntlet_win_count });
      }
      return res.status(404).end();
    })
    .catch((error) => next(error));
});

module.exports = router;
