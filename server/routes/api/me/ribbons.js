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
const knex = require('../../../lib/data_access/knex');
const DataAccessHelpers = require('../../../lib/data_access/helpers');
const Logger = require('../../../../app/common/logger');

const router = express.Router();

router.get('/', (req, res, next) => {
  const user_id = req.user.d.id;

  return knex('user_ribbons').where('user_id', user_id).select()
    .then((rows) => {
      rows = DataAccessHelpers.restifyData(rows);
      return res.status(200).json(rows);
    })
    .catch((error) => next(error));
});

module.exports = router;
