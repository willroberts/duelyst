/* eslint-disable
    camelcase,
    func-names,
    implicit-arrow-linebreak,
    import/extensions,
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

const router = express.Router();

const util = require('util');
const Promise = require('bluebird');
const moment = require('moment');
const t = require('tcomb-validation');
const Logger = require('../../app/common/logger.coffee');
const hashHelpers = require('../lib/hash_helpers.coffee');
const knex = require('../lib/data_access/knex');
const types = require('../validators/types');
const UsersModule = require('../lib/data_access/users');

// our modules
const mail = require('../mailer');

Promise.promisifyAll(mail);
const Errors = require('../lib/custom_errors.coffee');

// Configuration object
const config = require('../../config/config.js');

/*
GET Reset Token
*/
router.get('/verify/:verify_token', (req, res, next) => {
  const result = t.validate(req.params.verify_token, types.UUID);
  if (!result.isValid()) {
    return next();
  }

  const verify_token = result.value;

  return UsersModule.verifyEmailUsingToken(verify_token)
    .then(() => // Render the verified template
      res.format({
        'text/html': function () {
          return res.render(`${__dirname}/../templates/verified.hbs`, {
            title: 'Account Verified',
          });
        },
        'application/json': function () {
          return res.status(204).end();
        },
      })).catch(Errors.NotFoundError, () => // 404 it
      next()).catch((e) => next(e));
});

module.exports = router;
