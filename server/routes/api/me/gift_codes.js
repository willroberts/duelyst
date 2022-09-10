/* eslint-disable
    camelcase,
    import/no-unresolved,
    max-len,
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
const validator = require('validator');
const UsersModule = require('../../../lib/data_access/users');
const ReferralsModule = require('../../../lib/data_access/referrals');
const GiftCodesModule = require('../../../lib/data_access/gift_codes');
const knex = require('../../../lib/data_access/knex');
const DataAccessHelpers = require('../../../lib/data_access/helpers');
const Errors = require('../../../lib/custom_errors');
const Logger = require('../../../../app/common/logger');
const validators = require('../../../validators');
const validatorTypes = require('../../../validators/types');

const router = express.Router();

router.post('/', (req, res, next) => {
  const user_id = req.user.d.id;
  const {
    gift_code,
  } = req.body;

  const result = t.validate(gift_code, validatorTypes.GiftCode);
  if (!result.isValid()) {
    return res.status(400).json({ message: 'Invalid gift code.' });
  }

  // if this is a gift coee
  if (validator.isUUID(gift_code)) {
    return GiftCodesModule.redeemGiftCode(user_id, gift_code)
      .then(() => {
        Logger.module('API').debug(`user ${user_id} redeemed gift code`);
        return res.status(200).json({});
      }).catch(Errors.NotFoundError, (e) => res.status(400).json(e))
      .catch(Errors.BadRequestError, (e) => res.status(400).json(e))
      .catch((error) => next(error));

    // else assume it's a referral code
  }
  Logger.module('API').debug(`user ${user_id} redeemed referral code ${gift_code}`);

  return UsersModule.userIdForUsername(gift_code)
    .then((referrer_id) => {
      if (!referrer_id) {
        throw new Errors.NotFoundError();
      }
      return ReferralsModule.markUserAsReferredByFriend(user_id, referrer_id);
    }).then(() => res.status(200).json({})).catch(Errors.NotFoundError, (e) => res.status(400).json(e))
    .catch(Errors.BadRequestError, (e) => res.status(400).json(e))
    .catch((error) => next(error));
});

module.exports = router;
