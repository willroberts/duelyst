/* eslint-disable
    camelcase,
    no-param-reassign,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const express = require('express');
const t = require('tcomb-validation');
const knex = require('../../../lib/data_access/knex');
const DataAccessHelpers = require('../../../lib/data_access/helpers');
const Logger = require('../../../../app/common/logger');

const router = express.Router();

router.get('/', (req, res, next) => {
  // user id is set by a middleware
  const {
    user_id,
  } = req;

  return knex('user_faction_progression').where('user_id', user_id).select()
    .then((progressionRows) => {
      progressionRows = DataAccessHelpers.restifyData(progressionRows);
      const responseData = {};
      for (const row of Array.from(progressionRows)) {
        responseData[row.faction_id] = row;
      }
      return res.status(200).json(responseData);
    })
    .catch((error) => next(error));
});

router.get('/:faction_id', (req, res, next) => {
  const result = t.validate(parseInt(req.params.faction_id, 10), t.Number);
  if (!result.isValid()) {
    return next();
  }

  // user id is set by a middleware
  const {
    user_id,
  } = req;
  const faction_id = result.value;

  return knex('user_faction_progression').where('user_id', user_id).andWhere('faction_id', faction_id).first()
    .then((row) => {
      row = DataAccessHelpers.restifyData(row);
      return res.status(200).json(row);
    })
    .catch((error) => next(error));
});

module.exports = router;
