/* eslint-disable
    camelcase,
    func-names,
    import/extensions,
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
const t = require('tcomb-validation');
const uuid = require('node-uuid');
const moment = require('moment');
const Promise = require('bluebird');
const UsersModule = require('../../../lib/data_access/users');
const knex = require('../../../lib/data_access/knex');
const DataAccessHelpers = require('../../../lib/data_access/helpers');
const Logger = require('../../../../app/common/logger');
const Errors = require('../../../lib/custom_errors');
const mail = require('../../../mailer');

Promise.promisifyAll(mail);

const router = express.Router();

router.put('/portrait_id', (req, res, next) => {
  const result = t.validate(req.body.portrait_id, t.Number);
  if (!result.isValid()) {
    return res.status(400).json(result.errors);
  }

  const user_id = req.user.d.id;
  const new_portrait_id = result.value;

  return UsersModule.setPortraitId(user_id, new_portrait_id)
    .then(() => res.status(200).json({})).catch((error) => next(error));
});

router.put('/battle_map_id', (req, res, next) => {
  const result = t.validate(req.body.battle_map_id, t.maybe(t.Number));
  if (!result.isValid()) {
    return res.status(400).json(result.errors);
  }

  const user_id = req.user.d.id;
  const new_battle_map_id = result.value;

  return UsersModule.setBattleMapId(user_id, new_battle_map_id)
    .then(() => res.status(200).json({})).catch((error) => next(error));
});

router.put('/card_back_id', (req, res, next) => {
  const result = t.validate(req.body.card_back_id, t.Number);
  if (!result.isValid()) {
    return res.status(400).json(result.errors);
  }

  const user_id = req.user.d.id;
  const new_card_back_id = result.value;

  return UsersModule.setCardBackId(user_id, new_card_back_id)
    .then(() => res.status(200).json({})).catch((error) => next(error));
});

router.get('/email_verified_at', (req, res, next) => {
  const user_id = req.user.d.id;
  return knex('users').where('id', user_id).first('email_verified_at')
    .then((user) => res.status(200).json({
      email_verified_at: (user.email_verified_at != null ? user.email_verified_at.valueOf() : undefined),
    }))
    .catch((error) => next(error));
});

router.post('/email_verify_token', (req, res, next) => {
  const user_id = req.user.d.id;
  const verifyToken = uuid.v4();
  return UsersModule.userDataForId(user_id)
    .bind({})
    .then(function (user) {
      this.userRow = user;
      return knex('email_verify_tokens').where('user_id', user_id).delete();
    }).then(() => knex('email_verify_tokens').insert({
      user_id,
      verify_token: verifyToken,
      created_at: moment().utc().toDate(),
    }))
    .then(function () {
      mail.sendEmailVerificationLinkAsync(this.userRow.username, this.userRow.email, verifyToken);
      return res.status(200).json({});
    });
});

module.exports = router;
