/* eslint-disable
    camelcase,
    func-names,
    implicit-arrow-linebreak,
    import/no-unresolved,
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

const router = express.Router();
const util = require('util');
const Promise = require('bluebird');
const uuid = require('node-uuid');
const moment = require('moment');
const t = require('tcomb-validation');
const Logger = require('../../app/common/logger.coffee');
const hashHelpers = require('../lib/hash_helpers.coffee');
const knex = require('../lib/data_access/knex');
const mail = require('../mailer');

Promise.promisifyAll(mail);
const UsersModule = require('../lib/data_access/users');
const Errors = require('../lib/custom_errors.coffee');
const types = require('../validators/types');

/*
The forgot password section is different than all other routes
in that it supports both HTML and JSON. The HTML page is available
on /forgot directly and renders server-side HBS templates.
*/
router.get('/forgot', (req, res, next) => res.format({
  'text/html': function () {
    return res.render(`${__dirname}/../templates/forgot-password.hbs`, {
      title: 'Forgot Password',
    });
  },
  'application/json': function () {
    return next();
  },
}));

router.post('/forgot', (req, res, next) => {
  const result = t.validate(req.body.email, types.Email);
  if (!result.isValid()) {
    return res.format({
      'text/html': function () {
        return res.render(`${__dirname}/../templates/forgot-password.hbs`, {
          title: 'Forgot Password',
          error: 'That email was not found.',
        });
      },
      'application/json': function () {
        return res.status(400).json(result.errors);
      },
    });
  }

  const email = result.value.toLowerCase();

  // Create Reset Token + Send Reset Email
  return UsersModule.userDataForEmail(email)
    .bind({})
    .then(function (userData) {
      if (!userData) {
        return res.format({
          'text/html': function () {
            return res.render(`${__dirname}/../templates/forgot-password.hbs`, {
              title: 'Forgot Password',
              error: 'User not found',
            });
          },
          'application/json': function () {
            return res.status(404).json({});
          },
        });
      }
      this.userId = userData.id;
      this.username = userData.username;
      this.resetToken = uuid.v4();
      return knex('password_reset_tokens').insert({ reset_token: this.resetToken, user_id: this.userId, created_at: moment().utc().toDate() })
        .bind(this)
        .then(() => {
          mail.sendForgotPasswordAsync(this.username, email, this.resetToken);
          Logger.module('SESSION').debug('Forgot password mail sent');
          return res.format({
            'text/html': function () {
              return res.render(`${__dirname}/../templates/sent-reset.hbs`, {
                title: 'Email Sent',
              });
            },
            'application/json': function () {
              return res.status(200).json({});
            },
          });
        });
    }).catch((e) => next(e));
});

router.get('/forgot/:reset_token', (req, res, next) => {
  const result = t.validate(req.params.reset_token, types.UUID);
  if (!result.isValid()) {
    return next();
  }

  const reset_token = result.value;

  // Lookup token here
  return knex('password_reset_tokens').first().where('reset_token', reset_token)
    .bind({})
    .then(function (resetTokenData) {
      if (!(resetTokenData != null ? resetTokenData.user_id : undefined)) {
        throw new Errors.NotFoundError();
      }
      this.resetTokenData = resetTokenData;
      return knex('users').where('id', resetTokenData.user_id).first();
    })
    .then(function (userData) {
      // Validate token against expiration
      // Allow reset view if OK
      if (!userData) {
        throw new Errors.NotFoundError();
      } else {
        const userId = userData.id;
        const { email } = userData;
        const expires = moment.utc(this.resetTokenData.created_at).add(1, 'days').valueOf();
        const now = moment().utc().valueOf();
        if (now > expires) {
          // Invalidate / delete token
          // Render the expired template
          return res.format({
            'text/html': function () {
              res.status(403);
              return res.render(`${__dirname}/../templates/expired-reset.hbs`, {
                title: 'Reset Link Expired',
              });
            },
            'application/json': function () {
              return res.status(403).end();
            },
          });
        }
        // Render the reset template
        return res.format({
          'text/html': function () {
            return res.render(`${__dirname}/../templates/new-password.hbs`, {
              title: 'New Password',
              resetToken: reset_token,
            });
          },
          'application/json': function () {
            return res.status(204).end();
          },
        });
      }
    })
    .catch(Errors.NotFoundError, () => // 404 it
      next())
    .catch((e) => next(e));
});

router.post('/forgot/:reset_token', (req, res, next) => {
  let reset_token = t.validate(req.params.reset_token, types.UUID);
  if (!reset_token.isValid()) {
    return next();
  }

  let password = t.validate(req.body.password, types.NewPassword);
  if (!password.isValid()) {
    return res.format({
      'text/html': function () {
        res.status(400);
        return res.render(`${__dirname}/../templates/new-password.hbs`, {
          title: 'New Password',
          error: 'Invalid password.',
          resetToken: reset_token,
        });
      },
      'application/json': function () {
        return res.status(400).end();
      },
    });
  }

  password = password.value;
  reset_token = reset_token.value;

  // Lookup token here
  return knex('password_reset_tokens').first().where('reset_token', reset_token)
    .bind({})
    .then(function (resetTokenData) {
      if (!(resetTokenData != null ? resetTokenData.user_id : undefined)) {
        throw new Errors.NotFoundError();
      }
      this.resetTokenData = resetTokenData;
      return knex('users').where('id', resetTokenData.user_id).first();
    })
    .then(function (userData) {
      // Validate token against expiration
      // Allow reset view if OK
      if (!userData) {
        throw new Errors.NotFoundError();
      } else {
        const userId = userData.id;
        const { email } = userData;
        const { username } = userData;
        const expires = moment.utc(this.resetTokenData.created_at).add(1, 'days').valueOf();
        const now = moment().utc().valueOf();
        if (now > expires) {
          // Invalidate / delete token
          // Render the expired template
          return res.format({
            'text/html': function () {
              res.status(403);
              return res.render(`${__dirname}/../templates/expired-reset.hbs`, {
                title: 'Reset Link Expired',
              });
            },
            'application/json': function () {
              return res.status(403).end();
            },
          });
        }
        // Update the password
        // generateHash function returns hash for saving in DB
        return hashHelpers.generateHash(password)
          .then((hash) => Promise.all([
            knex('users').where('id', userId).update({ password: hash, password_updated_at: moment().utc().toDate() }),
            knex('password_reset_tokens').where('reset_token', reset_token).delete(),
          ])).then(() => {
            mail.sendPasswordConfirmationAsync(username, email);
            return res.format({
              'text/html': function () {
                return res.render(`${__dirname}/../templates/password-changed.hbs`, {
                  title: 'Password Changed',
                });
              },
              'application/json': function () {
                return res.status(204).end();
              },
            });
          });
      }
    })
    .catch(Errors.NotFoundError, () => // 404 it
      next())
    .catch((e) => next(e));
});

module.exports = router;
