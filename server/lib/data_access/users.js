/* eslint-disable
    camelcase,
    consistent-return,
    default-param-last,
    func-names,
    guard-for-in,
    implicit-arrow-linebreak,
    import/extensions,
    import/no-unresolved,
    max-len,
    no-continue,
    no-mixed-spaces-and-tabs,
    no-param-reassign,
    no-plusplus,
    no-restricted-syntax,
    no-return-assign,
    no-tabs,
    no-underscore-dangle,
    no-use-before-define,
    no-var,
    prefer-const,
    radix,
    vars-on-top,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Promise = require('bluebird');
const util = require('util');
const crypto = require('crypto');
const colors = require('colors');
const validator = require('validator');
const uuid = require('node-uuid');
const moment = require('moment');
const _ = require('underscore');
const Logger = require('../../../app/common/logger.coffee');
const fbUtil = require('../../../app/common/utils/utils_firebase.js');
const DuelystFirebase = require('../duelyst_firebase_module');
const FirebasePromises = require('../firebase_promises');
const SyncModule = require('./sync');
const MigrationsModule = require('./migrations');
const InventoryModule = require('./inventory');
const QuestsModule = require('./quests');
const GamesModule = require('./games');
let RiftModule = require('./rift');
RiftModule = require('./gauntlet');
const CosmeticChestsModule = require('./cosmetic_chests');
const CONFIG = require('../../../app/common/config.js');
const Errors = require('../custom_errors');
const mail = require('../../mailer');
const knex = require('./knex');
const config = require('../../../config/config.js');
const generatePushId = require('../../../app/common/generate_push_id');
const DataAccessHelpers = require('./helpers');
const hashHelpers = require('../hash_helpers.coffee');

Promise.promisifyAll(mail);
const AnalyticsUtil = require('../../../app/common/analyticsUtil.coffee');
const { version } = require('../../../version.json');

// redis
let { Redis, Jobs, GameManager } = require('../../redis');

// SDK imports
const SDK = require('../../../app/sdk');
const Cards = require('../../../app/sdk/cards/cardsLookupComplete');
const CardSetFactory = require('../../../app/sdk/cards/cardSetFactory');
const RankFactory = require('../../../app/sdk/rank/rankFactory');
const Entity = require('../../../app/sdk/entities/entity');
const QuestFactory = require('../../../app/sdk/quests/questFactory');
const QuestType = require('../../../app/sdk/quests/questTypeLookup');
const GameType = require('../../../app/sdk/gameType');
const GameFormat = require('../../../app/sdk/gameFormat');
const UtilsGameSession = require('../../../app/common/utils/utils_game_session.coffee');
const NewPlayerProgressionHelper = require('../../../app/sdk/progression/newPlayerProgressionHelper');
const NewPlayerProgressionStageEnum = require('../../../app/sdk/progression/newPlayerProgressionStageEnum');
const NewPlayerProgressionModuleLookup = require('../../../app/sdk/progression/newPlayerProgressionModuleLookup');

({ Redis, Jobs } = require('../../redis'));

class UsersModule {
  static initClass() {
    /**
		 * MAX number of daily games to count for play rewards.
		 * @public
		 */
    this.DAILY_REWARD_GAME_CAP = 200;

    /**
		 * Hours until FWOTD is available again.
		 * @public
		 */
    this.DAILY_WIN_CYCLE_HOURS = 22;
  }

  /**
	 * Retrieve an active and valid global referral code.
	 * @public
	 * @param	{String}	code		Referral Code
	 * @return	{Promise}				Promise that will return true or throw InvalidReferralCodeError exception .
	 */
  static getValidReferralCode(code) {
    // validate referral code and force it to lower case
    code = code != null ? code.toLowerCase().trim() : undefined;
    if (!validator.isLength(code, 4)) {
      return Promise.reject(new Errors.InvalidReferralCodeError('invalid referral code'));
    }

    const MOMENT_NOW_UTC = moment().utc();

    // we check if the referral code is a UUID so that anyone accidentally using invite codes doesn't error out
    if (validator.isUUID(code)) {
      return Promise.resolve({});
    }

    return knex('referral_codes').where('code', code).first()
      .then((referralCodeRow) => {
        if ((referralCodeRow != null)
			&& (referralCodeRow != null ? referralCodeRow.is_active : undefined)
			&& (((referralCodeRow != null ? referralCodeRow.signup_limit : undefined) == null) || ((referralCodeRow != null ? referralCodeRow.signup_count : undefined) < (referralCodeRow != null ? referralCodeRow.signup_limit : undefined)))
			&& (((referralCodeRow != null ? referralCodeRow.expires_at : undefined) == null) || moment.utc(referralCodeRow != null ? referralCodeRow.expires_at : undefined).isAfter(MOMENT_NOW_UTC))) {
          return referralCodeRow;
        }
        throw new Errors.InvalidReferralCodeError('referral code not found');
      });
  }

  /**
	 * Check if an invite code is valid.
	 * @public
	 * @param	{String}	inviteCode	Invite Code
	 * @return	{Promise}				Promise that will return true or throw InvalidInviteCodeError exception .
	 */
  static isValidInviteCode(inviteCode, cb) {
    if (inviteCode == null) { inviteCode = null; }

    return knex('invite_codes').where('code', inviteCode).first()
      .then((codeRow) => {
        if (!config.get('inviteCodesActive') || (codeRow != null) || (inviteCode === 'kumite14') || (inviteCode === 'keysign789')) {
          return true;
        }
        throw new Errors.InvalidInviteCodeError('Invalid Invite Code');
      });
  }

  /**
	 * Create a user record for the specified parameters.
	 * @public
	 * @param	{String}	email			User's email (no longer strictly required)
	 * @param	{String}	username		User's username
	 * @param	{String}	password		User's password
	 * @param	{String}	inviteCode		Invite code used
	 * @return	{Promise}					Promise that will return the userId on completion.
	 */
  static createNewUser(email = null, username, password, inviteCode, referralCode, campaignData, registrationSource = null) {
    // validate referral code and force it to lower case
    if (inviteCode == null) { inviteCode = 'kumite14'; }
    referralCode = referralCode != null ? referralCode.toLowerCase().trim() : undefined;
    if ((referralCode != null) && !validator.isLength(referralCode, 3)) {
      return Promise.reject(new Errors.InvalidReferralCodeError('invalid referral code'));
    }

    if (email) { email = email.toLowerCase(); }
    const userId = generatePushId();
    username = username.toLowerCase();
    if (inviteCode == null) { inviteCode = null; }

    const MOMENT_NOW_UTC = moment().utc();
    const this_obj = {};

    return knex('invite_codes').where('code', inviteCode).first()
      .bind(this_obj)
      .then((inviteCodeRow) => {
        if (config.get('inviteCodesActive') && !inviteCodeRow && (inviteCode !== 'kumite14') && (inviteCode !== 'keysign789')) {
          throw new Errors.InvalidInviteCodeError('Invite code not found');
        }

        let referralCodePromise = Promise.resolve(null);
        // we check if the referral code is a UUID so that anyone accidentally using invite codes doesn't error out
        if ((referralCode != null) && !validator.isUUID(referralCode)) {
          referralCodePromise = UsersModule.getValidReferralCode(referralCode);
        }

        return Promise.all([
          UsersModule.userIdForEmail(email),
          UsersModule.userIdForUsername(username),
          referralCodePromise,
        ]);
      })
      .spread(function (idForEmail, idForUsername, referralCodeRow) {
        if (idForEmail) {
          throw new Errors.AlreadyExistsError('Email already registered');
        }
        if (idForUsername) {
          throw new Errors.AlreadyExistsError('Username not available');
        }

        this.referralCodeRow = referralCodeRow;

        return hashHelpers.generateHash(password);
      })
      .then(function (passwordHash) {
        return knex.transaction((tx) => {
          const userRecord = {
            id: userId,
            email, // email maybe equals null here
            username,
            password: passwordHash,
            created_at: MOMENT_NOW_UTC.toDate(),
          };

          if (registrationSource) {
            userRecord.registration_source = registrationSource;
          }

          if (config.get('inviteCodesActive')) {
            userRecord.invite_code = inviteCode;
          }

          // Add campaign data to userRecord
          if (campaignData != null) {
            if (userRecord.campaign_source == null) { userRecord.campaign_source = campaignData.campaign_source; }
            if (userRecord.campaign_medium == null) { userRecord.campaign_medium = campaignData.campaign_medium; }
            if (userRecord.campaign_term == null) { userRecord.campaign_term = campaignData.campaign_term; }
            if (userRecord.campaign_content == null) { userRecord.campaign_content = campaignData.campaign_content; }
            if (userRecord.campaign_name == null) { userRecord.campaign_name = campaignData.campaign_name; }
            if (userRecord.referrer == null) { userRecord.referrer = campaignData.referrer; }
          }

          let updateReferralCodePromise = Promise.resolve();
          if (this.referralCodeRow != null) {
            Logger.module('USERS').debug(`createNewUser() -> using referral code ${referralCode.yellow} for user ${userId.blue} `, this.referralCodeRow.params);
            userRecord.referral_code = referralCode;
            updateReferralCodePromise = knex('referral_codes').where('code', referralCode).increment('signup_count', 1).transacting(tx);
            if (this.referralCodeRow.params != null ? this.referralCodeRow.params.gold : undefined) {
              if (userRecord.wallet_gold == null) { userRecord.wallet_gold = 0; }
              userRecord.wallet_gold += this.referralCodeRow.params != null ? this.referralCodeRow.params.gold : undefined;
            }
            if (this.referralCodeRow.params != null ? this.referralCodeRow.params.spirit : undefined) {
              if (userRecord.wallet_spirit == null) { userRecord.wallet_spirit = 0; }
              userRecord.wallet_spirit += this.referralCodeRow.params != null ? this.referralCodeRow.params.spirit : undefined;
            }
          }

          Promise.all([
            // user record
            knex('users').insert(userRecord).transacting(tx),
            // update referal code table
            updateReferralCodePromise,
          ])
            .bind(this_obj)
            .then(() => DuelystFirebase.connect().getRootRef())
            .then(function (rootRef) {
              // collect all the firebase update promises here
              const allPromises = [];

              const userData = {
                id: userId,
                username,
                created_at: MOMENT_NOW_UTC.valueOf(),
                presence: {
                  rank: 30,
                  username,
                  status: 'offline',
                },
                tx_counter: {
                  count: 0,
                },
                // all new users have accepted EULA before signing up
                hasAcceptedEula: false,
                hasAcceptedSteamEula: false,
              };

              const starting_gold = __guard__(this.referralCodeRow != null ? this.referralCodeRow.params : undefined, (x) => x.gold) || 0;
              const starting_spirit = __guard__(this.referralCodeRow != null ? this.referralCodeRow.params : undefined, (x1) => x1.spirit) || 0;

              allPromises.push(FirebasePromises.set(rootRef.child('users').child(userId), userData));
              allPromises.push(FirebasePromises.set(rootRef.child('username-index').child(username), userId));
              allPromises.push(FirebasePromises.set(rootRef.child('user-inventory').child(userId).child('wallet'), {
                gold_amount: starting_gold,
                spirit_amount: starting_spirit,
              }));

              return Promise.all(allPromises);
            })
            .then(tx.commit)
            .catch(tx.rollback);
        }).bind(this_obj)
          .then(() => {
            if (config.get('inviteCodesActive')) {
              return knex('invite_codes').where('code', inviteCode).delete();
            }
          }).then(() => // if email then mail.sendSignupAsync(username, email, verifyToken)

          // NOTE: don't send registration notifications at large volume, and also since they contain PID
          // mail.sendNotificationAsync("New Registration", "#{email} has registered with #{username}.")

            Promise.resolve(userId));
      });
  }

  /**
	 * Delete a newly created user record in the event of partial registration.
	 * @public
	 * @param	{String}	userId			User's ID
	 * @return	{Promise}					Promise that will return the userId on completion.
	 */
  static deleteNewUser(userId) {
    let username = null;

    return this.userDataForId(userId)
      .then((userRow) => {
        if (!userRow) {
          throw new Errors.NotFoundError();
        }
        ({
          username,
        } = userRow);
        return knex('users').where('id', userId).delete();
      }).then(() => DuelystFirebase.connect().getRootRef())
      .then((rootRef) => {
        const promises = [
          FirebasePromises.remove(rootRef.child('users').child(userId)),
          FirebasePromises.remove(rootRef.child('user-inventory').child(userId)),
        ];
        if (username) {
          promises.push(FirebasePromises.remove(rootRef.child('username-index').child(username)));
        }
        return Promise.all(promises);
      });
  }

  /**
	 * Change a user's username.
	 * It will skip gold check if the username has never been set (currently null)
	 * @public
	 * @param	{String}	userId			User ID
	 * @param	{String}	username		New username
	 * @param	{Moment}	systemTime		Pass in the current system time to override clock. Used mostly for testing.
	 * @return	{Promise}					Promise that will return on completion.
	 */
  static changeUsername(userId, newUsername, forceItForNoGold, systemTime) {
    if (forceItForNoGold == null) { forceItForNoGold = false; }
    const MOMENT_NOW_UTC = systemTime || moment().utc();
    const this_obj = {};

    return UsersModule.userIdForUsername(newUsername)
      .bind({})
      .then((existingUserId) => {
        if (existingUserId) {
          throw new Errors.AlreadyExistsError('Username already exists');
        } else {
          return knex.transaction((tx) => {
            knex('users').where('id', userId).first('username', 'username_updated_at', 'wallet_gold').forUpdate()
              .transacting(tx)
              .bind({})
              .then(function (userRow) {
                // we should have a user
                let userUpdateParams;
                if (!userRow) {
                  throw new Errors.NotFoundError();
                }

                // let's figure out if we're allowed to change the username and how much it should cost
                // if username was null, price stays 0
                let price = 0;
                if (!forceItForNoGold && userRow.username_updated_at && userRow.username) {
                  price = 100;
                  const timeSinceLastChange = moment.duration(MOMENT_NOW_UTC.diff(moment.utc(userRow.username_updated_at)));
                  if (timeSinceLastChange.asMonths() < 1.0) {
                    throw new Errors.InvalidRequestError('Username can\'t be changed twice in one month');
                  }
                }

                this.price = price;
                this.oldUsername = userRow.username;

                if ((price > 0) && (userRow.wallet_gold < price)) {
                  throw new Errors.InsufficientFundsError('Insufficient gold to update username');
                }

                const allUpdates = [];

                // if username was null, we skip setting the updated_at flag since it is being set for first time
                if (!this.oldUsername) {
                  userUpdateParams =								{ username: newUsername };
                } else {
                  userUpdateParams = {
                    username: newUsername,
                    username_updated_at: MOMENT_NOW_UTC.toDate(),
                  };
                }

                if (price > 0) {
                  userUpdateParams.wallet_gold = userRow.wallet_gold - price;
                  userUpdateParams.wallet_updated_at = MOMENT_NOW_UTC.toDate();

                  const userCurrencyLogItem = {
                    id:	generatePushId(),
                    user_id:	userId,
                    gold:	-price,
                    memo:	'username change',
                    created_at:	MOMENT_NOW_UTC.toDate(),
                  };

                  allUpdates.push(knex('user_currency_log').insert(userCurrencyLogItem).transacting(tx));
                }

                allUpdates.push(knex('users').where('id', userId).update(userUpdateParams).transacting(tx));

                return Promise.all(allUpdates);
              })
              .then(() => DuelystFirebase.connect().getRootRef())
              .then(function (rootRef) {
                const updateWalletData = (walletData) => {
                  if (walletData == null) { walletData = {}; }
                  if (walletData.gold_amount == null) { walletData.gold_amount = 0; }
                  walletData.gold_amount -= this.price;
                  walletData.updated_at = MOMENT_NOW_UTC.valueOf();
                  return walletData;
                };

                const allPromises = [
                  FirebasePromises.set(rootRef.child('username-index').child(newUsername), userId),
                  FirebasePromises.set(rootRef.child('users').child(userId).child('presence').child('username'), newUsername),
                ];
                // if username was null, we skip setting the updated_at flag since it is being set for first time
                // and there is no old index to remove
                if (!this.oldUsername) {
                  allPromises.push(FirebasePromises.update(rootRef.child('users').child(userId), { username: newUsername }));
                } else {
                  allPromises.push(FirebasePromises.remove(rootRef.child('username-index').child(this.oldUsername)));
                  allPromises.push(FirebasePromises.update(rootRef.child('users').child(userId), { username: newUsername, username_updated_at: MOMENT_NOW_UTC.valueOf() }));
                }

                if (this.price > 0) {
                  allPromises.push(FirebasePromises.safeTransaction(rootRef.child('user-inventory').child(userId).child('wallet'), updateWalletData));
                }

                return Promise.all(allPromises);
              })
              .then(() => SyncModule._bumpUserTransactionCounter(tx, userId))
              .then(tx.commit)
              .catch(tx.rollback);
          });
        }
      });
  }

  /**
	 * Change a user's email address.
	 * @public
	 * @param	{String}	userId			User ID
	 * @param	{String}	newEmail		New email
	 * @param	{Moment}	systemTime		Pass in the current system time to override clock. Used mostly for testing.
	 * @return	{Promise}					Promise that will return on completion.
	 */
  static changeEmail(userId, newEmail, systemTime) {
    const MOMENT_NOW_UTC = systemTime || moment().utc();
    const this_obj = {};

    return UsersModule.userIdForEmail(newEmail)
      .bind({})
      .then((existingUserId) => {
        if (existingUserId) {
          throw new Errors.AlreadyExistsError('Email already exists');
        } else {
          return knex.transaction((tx) => {
            knex('users').where('id', userId).first('email').forUpdate()
              .transacting(tx)
              .bind({})
              .then(function (userRow) {
                // we should have a user
                if (!userRow) {
                  throw new Errors.NotFoundError();
                }

                this.oldEmail = userRow.email;

                const userUpdateParams =							{ email: newEmail };

                return knex('users').where('id', userId).update(userUpdateParams).transacting(tx);
              })
              .then(() => SyncModule._bumpUserTransactionCounter(tx, userId))
              .then(tx.commit)
              .catch(tx.rollback);
          });
        }
      });
  }

  /**
	 * Mark a user record as having verified email.
	 * @public
	 * @param	{String}	token			Verification Token
	 * @return	{Promise}					Promise that will return on completion.
	 */
  static verifyEmailUsingToken(token) {
    const MOMENT_NOW_UTC = moment().utc();

    return knex('email_verify_tokens').first().where('verify_token', token)
      .bind({})
      .then(function (tokenRow) {
        this.tokenRow = tokenRow;
        if (!(tokenRow != null ? tokenRow.created_at : undefined)) {
          throw new Errors.NotFoundError();
        }

        const duration = moment.duration(moment().utc().valueOf() - moment.utc(tokenRow != null ? tokenRow.created_at : undefined).valueOf());

        if (duration.asDays() < 1) {
          return Promise.all([
            knex('users').where('id', tokenRow.user_id).update({ email_verified_at: MOMENT_NOW_UTC.toDate() }), // mark user as verified
            knex('email_verify_tokens').where('user_id', tokenRow.user_id).delete(), // delete all user's verify tokens
          ]);
        }
        throw new Errors.NotFoundError();
      });
  }

  /**
	 * Change a user's password.
	 * @public
	 * @param	{String}	userId				User ID
	 * @param	{String}	oldPassword			Old password
	 * @param	{String}	newPassword			New password
	 * @return	{Promise}						Promise that will return on completion.
	 */
  static changePassword(userId, oldPassword, newPassword) {
    const MOMENT_NOW_UTC = moment().utc();

    return knex.transaction((tx) => {
      knex('users').where('id', userId).first('password').forUpdate()
        .transacting(tx)
        .bind({})
        .then((userRow) => {
          if (!userRow) {
            throw new Errors.NotFoundError();
          } else {
            return hashHelpers.comparePassword(oldPassword, userRow.password);
          }
        })
        .then((match) => {
          if (!match) {
            throw new Errors.BadPasswordError();
          } else {
            return hashHelpers.generateHash(newPassword);
          }
        })
        .then((hash) => knex('users').where('id', userId).update({
          password: hash,
          password_updated_at: MOMENT_NOW_UTC.toDate(),
        }).transacting(tx))
        .then(tx.commit)
        .catch(tx.rollback);
    });
  }

  /**
	 * Associate a Google Play ID to a User
	 * @public
	 * @param	{String}	userId User ID
	 * @param	{String}	googlePlayId User's Google Play ID
	 * @return	{Promise}	Promise that will return on completion
	 */
  static associateGooglePlayId(userId, googlePlayId) {
    const MOMENT_NOW_UTC = moment().utc();

    return knex.transaction((tx) => {
      knex('users').where('id', userId).first().forUpdate()
        .transacting(tx)
        .bind({})
        .then((userRow) => {
          if (!userRow) {
            throw new Errors.NotFoundError();
          } else {
            return knex('users').where('id', userId).update({
              google_play_id: googlePlayId,
              google_play_associated_at: MOMENT_NOW_UTC.toDate(),
            }).transacting(tx);
          }
        })
        .then(tx.commit)
        .catch(tx.rollback);
    });
  }

  /**
	 * Disassociate a Google Play ID to a User
	 * Currently only used for testing
	 * @public
	 * @param	{String}	userId User ID
	 * @return	{Promise}	Promise that will return on completion.
	 */
  static disassociateGooglePlayId(userId) {
    return knex.transaction((tx) => {
      knex('users').where('id', userId).first().forUpdate()
        .transacting(tx)
        .bind({})
        .then((userRow) => {
          if (!userRow) {
            throw new Errors.NotFoundError();
          } else {
            return knex('users').where('id', userId).update({
              google_play_id: null,
              google_play_associated_at: null,
            }).transacting(tx);
          }
        })
        .then(tx.commit)
        .catch(tx.rollback);
    });
  }

  /**
	 * Associate a Gamecenter ID to a user
	 * @public
	 * @param	{String}	userId User ID
	 * @param	{String}	gamecenterId User's Gamecenter Id
	 * @return	{Promise}	Promise that will return on completion
	 */
  static associateGameCenterId(userId, gameCenterId) {
    const MOMENT_NOW_UTC = moment().utc();

    return knex.transaction((tx) => {
      knex('users').where('id', userId).first().forUpdate()
        .transacting(tx)
        .bind({})
        .then((userRow) => {
          if (!userRow) {
            throw new Errors.NotFoundError();
          } else {
            return knex('users').where('id', userId).update({
              gamecenter_id: gameCenterId,
              gamecenter_associated_at: MOMENT_NOW_UTC.toDate(),
            }).transacting(tx);
          }
        })
        .then(tx.commit)
        .catch(tx.rollback);
    });
  }

  /**
	 * Disassociate a Gamecenter ID to a User
	 * Currently only used for testing
	 * @public
	 * @param	{String}	userId User ID
	 * @return	{Promise}	Promise that will return on completion.
	 */
  static disassociateGameCenterId(userId) {
    return knex.transaction((tx) => {
      knex('users').where('id', userId).first().forUpdate()
        .transacting(tx)
        .bind({})
        .then((userRow) => {
          if (!userRow) {
            throw new Errors.NotFoundError();
          } else {
            return knex('users').where('id', userId).update({
              gamecenter_id: null,
              gamecenter_associated_at: null,
            }).transacting(tx);
          }
        })
        .then(tx.commit)
        .catch(tx.rollback);
    });
  }

  /**
	 * Associate a Steam ID to a User
	 * @public
	 * @param	{String}	userId				User ID
	 * @param	{String}	steamId				User's Steam ID as returned from steam.coffee authenticateUserTicket
	 * @return	{Promise}						Promise that will return on completion.
	 */
  static associateSteamId(userId, steamId) {
    const MOMENT_NOW_UTC = moment().utc();

    return knex.transaction((tx) => {
      knex('users').where('id', userId).first().forUpdate()
        .transacting(tx)
        .bind({})
        .then((userRow) => {
          if (!userRow) {
            throw new Errors.NotFoundError();
          } else {
            return knex('users').where('id', userId).update({
              steam_id: steamId,
              steam_associated_at: MOMENT_NOW_UTC.toDate(),
            }).transacting(tx);
          }
        })
        .then(tx.commit)
        .catch(tx.rollback);
    });
  }

  /**
	 * Disassociate a Steam ID to a User
	 * Currently only used for testing
	 * @public
	 * @param	{String}	userId				User ID
	 * @return	{Promise}						Promise that will return on completion.
	 */
  static disassociateSteamId(userId) {
    return knex.transaction((tx) => {
      knex('users').where('id', userId).first().forUpdate()
        .transacting(tx)
        .bind({})
        .then((userRow) => {
          if (!userRow) {
            throw new Errors.NotFoundError();
          } else {
            return knex('users').where('id', userId).update({
              steam_id: null,
              steam_associated_at: null,
            }).transacting(tx);
          }
        })
        .then(tx.commit)
        .catch(tx.rollback);
    });
  }

  /**
	 * Get user data for id.
	 * @public
	 * @param	{String}	userId			User ID
	 * @return	{Promise}					Promise that will return the user data on completion.
	 */
  static userDataForId(userId) {
    return knex('users').first().where('id', userId);
  }

  /**
	 * Get user data for email.
	 * @public
	 * @param	{String}	email			User Email
	 * @return	{Promise}					Promise that will return the user data on completion.
	 */
  static userDataForEmail(email) {
    return knex('users').first().where('email', email);
  }

  /**
	 * Intended to be called on login/reload to bump session counter and check transaction counter to update user caches / initiate any hot copies.
	 * @public
	 * @param	{String}	userId			User ID
	 * @param	{Object}	userData		User data if previously loaded
	 * @return	{Promise}					Promise that will return synced when done
	 */
  static bumpSessionCountAndSyncDataIfNeeded(userId, userData = null, systemTime = null) {
    const MOMENT_NOW_UTC = systemTime || moment().utc();

    let startPromise = null;
    if (userData) {
      startPromise = Promise.resolve(userData);
    } else {
      startPromise = knex('users').where('id', userId).first('id', 'created_at', 'session_count', 'last_session_at', 'last_session_version');
    }

    return startPromise

      .then(function (userData) {
        this.userData = userData;

        if ((this.userData == null)) {
          throw new Errors.NotFoundError('User not found');
        }

        // Check if user needs to have emotes migrated to cosmetics inventory
        return MigrationsModule.checkIfUserNeedsMigrateEmotes20160708(this.userData);
      }).then((userNeedsMigrateEmotes) => {
        if (userNeedsMigrateEmotes) {
          return MigrationsModule.userMigrateEmotes20160708(userId, MOMENT_NOW_UTC);
        }
        return Promise.resolve();
      }).then(function () {
        return MigrationsModule.checkIfUserNeedsPrismaticBackfillReward(this.userData);
      }).then((userNeedsPrismaticBackfill) => {
        if (userNeedsPrismaticBackfill) {
          return MigrationsModule.userBackfillPrismaticRewards(userId, MOMENT_NOW_UTC);
        }
        return Promise.resolve();
      })
      .then(function () { // migrate user charge counts for purchase limits
        return MigrationsModule.checkIfUserNeedsChargeCountsMigration(this.userData).then((needsMigration) => {
          if (needsMigration) {
            return MigrationsModule.userCreateChargeCountsMigration(userId);
          }
          return Promise.resolve();
        });
      })
      .then(function () {
        return MigrationsModule.checkIfUserNeedsIncompleteGauntletRefund(this.userData).then((needsMigration) => {
          if (needsMigration) {
            return MigrationsModule.userIncompleteGauntletRefund(userId);
          }
          return Promise.resolve();
        });
      })
      .then(function () {
        return MigrationsModule.checkIfUserNeedsUnlockableOrbsRefund(this.userData).then((needsMigration) => {
          if (needsMigration) {
            return MigrationsModule.userUnlockableOrbsRefund(userId);
          }
          return Promise.resolve();
        });
      })
      .then(function () {
        const lastSessionTime = moment.utc(this.userData.last_session_at).valueOf() || 0;
        const duration = moment.duration(MOMENT_NOW_UTC.valueOf() - lastSessionTime);

        if (moment.utc(this.userData.created_at).isBefore(moment.utc('2016-06-18')) && moment.utc(this.userData.last_session_at).isBefore(moment.utc('2016-06-18'))) {
          Logger.module('UsersModule').debug(`bumpSessionCountAndSyncDataIfNeeded() -> starting inventory achievements for user - ${userId.blue}.`);
          // Kick off job to update achievements
          Jobs.create('update-user-achievements', {
            name: 'Update User Inventory Achievements',
            title: util.format('User %s :: Update Inventory Achievements', userId),
            userId,
            inventoryChanged: true,
          }).removeOnComplete(true).save();
        }

        if (duration.asHours() > 2) {
          return knex('users').where('id', userId).update({
            session_count: this.userData.session_count + 1,
            last_session_at: MOMENT_NOW_UTC.toDate(),
          });
        }

        return Promise.resolve();
      })
      .then(function () {
        // Update a user's last seen session if needed

        if ((this.userData.last_session_version == null) || (this.userData.last_session_version !== version)) {
          return knex('users').where('id', userId).update({
            last_session_version: version,
          });
        }
        return Promise.resolve();
      })
      .then(function () {
        return SyncModule.syncUserDataIfTrasactionCountMismatched(userId, this.userData);
      })
      .then((synced) => // # Job: Sync user buddy data
      // Jobs.create("data-sync-user-buddy-list",
      //    name: "Sync User Buddy Data"
      //    title: util.format("User %s :: Sync Buddies", userId)
      //    userId: userId
      // ).removeOnComplete(true).save()

        synced);
  }

  /**
	 * Intended to be called on login/reload to fire off a job which tracks cohort data for given user
	 * @public
	 * @param	{String}	userId			User ID
	 * @param	{Moment}	systemTime		Pass in the current system time to use. Used only for testing.
	 * @return	{Promise}	Promise.resolve() for now since all handling is done in job
	 */
  static createDaysSeenOnJob(userId, systemTime) {
    const MOMENT_NOW_UTC = systemTime || moment().utc();

    Jobs.create('update-user-seen-on', {
      name: 'Update User Seen On',
      title: util.format('User %s :: Update Seen On', userId),
      userId,
      userSeenOn: MOMENT_NOW_UTC.valueOf(),
    }).removeOnComplete(true).save();

    return Promise.resolve();
  }

  /**
	 * Intended to be called on login/reload to fire off a job which tracks cohort data for given user
	 * @public
	 * @param	{String}	userId			User ID
	 * @param	{Moment}	systemTime		Pass in the current system time to use. Used only for testing.
	 * @return	{Promise}	Promise.resolve() for now since all handling is done in job
	 */
  static createSteamFriendsSyncJob(userId, friendSteamIds) {
    Jobs.create('data-sync-steam-friends', {
      name: 'Sync Steam Friends',
      title: util.format('User %s :: Sync Steam Friends', userId),
      userId,
      friendsSteamIds: friendSteamIds,
    }).removeOnComplete(true).save();

    return Promise.resolve();
  }

  /**
	 * Updates the users row if they have newly logged in on a set day
	 * @public
	 * @param	{String}	userId			User ID
	 * @param	{Moment}	userSeenOn		Moment representing the time the user was seen (at point of log in)
	 * @return	{Promise}	Promise that completes when user's days seen is updated (if needed)
	 */
  static updateDaysSeen(userId, userSeenOn) {
    return knex.first('created_at', 'seen_on_days').from('users').where('id', userId)
      .then((userRow) => {
        const recordedDayIndex = AnalyticsUtil.recordedDayIndexForRegistrationAndSeenOn(moment.utc(userRow.created_at), userSeenOn);

        if ((recordedDayIndex == null)) {
          return Promise.resolve();
        }
        const userSeenOnDays = userRow.seen_on_days || [];

        let needsUpdate = false;
        if (!_.contains(userSeenOnDays, recordedDayIndex)) {
          needsUpdate = true;
          userSeenOnDays.push(recordedDayIndex);
        }

        // perform update if needed
        if (needsUpdate) {
          return knex('users').where({ id: userId }).update({ seen_on_days: userSeenOnDays });
        }
        return Promise.resolve();
      });
  }

  /**
	 * Get the user ID for the specified email.
	 * @public
	 * @param	{String}	email		User's email
	 * @return	{Promise}				Promise that will return the userId data on completion.
	 */
  static userIdForEmail(email, callback) {
    if (!email) { return Promise.resolve(null).nodeify(callback); }

    return knex.first('id').from('users').where('email', email)
      .then((userRow) => new Promise((resolve, reject) => {
        if (userRow) {
          return resolve(userRow.id);
        }
        return resolve(null);
      }).nodeify(callback));
  }

  /**
	 * Get the user ID for the specified username.
	 * @public
	 * @param	{String}	username	User's username (CaSE in-sensitive)
	 * @return	{Promise}				Promise that will return the userId data on completion.
	 */
  static userIdForUsername(username, callback) {
    // usernames are ALWAYS lowercase, so when searching downcase by default
    username = username != null ? username.toLowerCase() : undefined;

    return knex.first('id').from('users').where('username', username)
      .then((userRow) => new Promise((resolve, reject) => {
        if (userRow) {
          return resolve(userRow.id);
        }
        return resolve(null);
      }).nodeify(callback));
  }

  /**
	 * Get the user ID for the specified Steam ID.
	 * Reference steam.coffee's authenticateUserTicket
	 * @public
	 * @param	{String}	steamId	User's Steam ID as returned from steam.coffee authenticateUserTicket
	 * @return	{Promise}				Promise that will return the userId data on completion.
	 */
  static userIdForSteamId(steamId, callback) {
    return knex.first('id').from('users').where('steam_id', steamId)
      .then((userRow) => new Promise((resolve, reject) => {
        if (userRow) {
          return resolve(userRow.id);
        }
        return resolve(null);
      }).nodeify(callback));
  }

  /**
	 * Get the user ID for the specified Google Play ID.
	 * @public
	 * @param	{String}	googlePlayId	User's Google Play ID
	 * @return	{Promise}	Promise that will return the userId data on completion.
	 */
  static userIdForGooglePlayId(googlePlayId, callback) {
    return knex.first('id').from('users').where('google_play_id', googlePlayId)
      .then((userRow) => new Promise((resolve, reject) => {
        if (userRow) {
          return resolve(userRow.id);
        }
        return resolve(null);
      }).nodeify(callback));
  }

  /**
	 * Get the user ID for the specified Gamecenter ID.
	 * @public
	 * @param	{String}	gameCenterId	User's Gamecenter ID
	 * @return	{Promise}	Promise that will return the userId data on completion.
	 */
  static userIdForGameCenterId(gameCenterId, callback) {
    return knex.first('id').from('users').where('gamecenter_id', gameCenterId)
      .then((userRow) => new Promise((resolve, reject) => {
        if (userRow) {
          return resolve(userRow.id);
        }
        return resolve(null);
      }).nodeify(callback));
  }

  /**
	 * Validate that a deck is valid and that the user is allowed to play it.
	 * @public
	 * @param	{String}	userId			User ID.
	 * @param	{Array}		deck			Array of card objects with at least card IDs.
	 * @param	{String}	gameType	game type (see SDK.GameType)
	 * @param	{Boolean}	[forceValidation=false]	Force validation regardless of ENV. Useful for unit tests.
	 * @return	{Promise}					Promise that will resolve if the deck is valid and throw an "InvalidDeckError" otherwise
	 */
  static isAllowedToUseDeck(userId, deck, gameType, ticketId, forceValidation) {
    // userId must be defined
    let generalCard;
    if (!userId || !deck) {
      Logger.module('UsersModule').debug(`isAllowedToUseDeck() -> invalid user ID or deck parameter - ${userId.blue}.`.red);
      return Promise.reject(new Errors.InvalidDeckError(`invalid user ID or deck - ${userId}`));
    }

    // on DEV + STAGING environments, always allow any deck
    if (!forceValidation && config.get('allCardsAvailable')) {
      Logger.module('UsersModule').debug(`isAllowedToUseDeck() -> valid deck because this environment allows all cards ALL_CARDS_AVAILABLE = ${config.get('allCardsAvailable')} - ${userId.blue}.`.green);
      return Promise.resolve(true);
    }

    // check for valid general
    let deckFactionId = null;
    const generalId = deck[0] != null ? deck[0].id : undefined;
    if (generalId != null) {
      generalCard = SDK.GameSession.getCardCaches().getCardById(generalId);
    }

    if (!(generalCard != null ? generalCard.isGeneral : undefined)) {
      Logger.module('UsersModule').debug(`isAllowedToUseDeck() -> first card in the deck must be a general - ${userId.blue}.`.yellow);
      return Promise.reject(new Errors.InvalidDeckError('First card in the deck must be a general'));
    }
    deckFactionId = generalCard.factionId;

    if (gameType === GameType.Gauntlet) {
      Logger.module('UsersModule').debug(`isAllowedToUseDeck() -> Allowing ANY arena deck for now - ${userId.blue}.`.green);
      return Promise.resolve(true);
    } if ((ticketId != null) && (gameType === GameType.Friendly)) {
      //			# Validate a friendly rift deck
      //			return RiftModule.getRiftRunDeck(userId,ticketId)
      //			.then (riftDeck) ->
      //				sortedDeckIds = _.sortBy(_.map(deck,(cardObject) -> return cardObject.id),(id) -> return id)
      //				sortedRiftDeckIds = _.sortBy(riftDeck,(id)-> return id)
      //				if (sortedDeckIds.length != sortedRiftDeckIds.length)
      //					return Promise.reject(new Errors.InvalidDeckError("Friendly rift deck has incorrect card count: " + sortedDeckIds.length))
      //
      //				for i in [0...sortedDeckIds.length]
      //					if sortedDeckIds[i] != sortedRiftDeckIds[i]
      //						return Promise.reject(new Errors.InvalidDeckError("Friendly rift deck has incorrect cards"))
      //
      //				return Promise.resolve(true)
      // Validate a friendly gauntlet deck
      const decksExpireMoment = moment.utc().subtract(CONFIG.DAYS_BEFORE_GAUNTLET_DECK_EXPIRES, 'days');
      const currentDeckPromise = knex('user_gauntlet_run').first('deck').where('user_id', userId).andWhere('ticket_id', ticketId);
      const oldDeckPromise = knex('user_gauntlet_run_complete').first('deck', 'ended_at').where('user_id', userId).andWhere('id', ticketId)
        .andWhere('ended_at', '>', decksExpireMoment.toDate());
      return Promise.all([currentDeckPromise, oldDeckPromise])
        .spread((currentRunRow, completedRunRow) => {
          let matchingRunRow = null;
          if (currentRunRow != null) {
            matchingRunRow = currentRunRow;
          } else if (completedRunRow != null) {
            matchingRunRow = completedRunRow;
          } else {
            return Promise.reject(new Errors.InvalidDeckError(`Friendly gauntlet deck has no matching recent run, ticket_id: ${ticketId}`));
          }
          const gauntletDeck = matchingRunRow.deck;

          const sortedDeckIds = _.sortBy(_.map(deck, (cardObject) => cardObject.id), (id) => id);
          const sortedGauntletDeckIds = _.sortBy(gauntletDeck, (id) => id);
          if (sortedDeckIds.length !== sortedGauntletDeckIds.length) {
            return Promise.reject(new Errors.InvalidDeckError(`Friendly gauntlet deck has incorrect card count: ${sortedDeckIds.length}`));
          }

          for (let i = 0, end = sortedDeckIds.length, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
            if (sortedDeckIds[i] !== sortedGauntletDeckIds[i]) {
              return Promise.reject(new Errors.InvalidDeckError('Friendly gauntlet deck has incorrect cards'));
            }
          }

          return Promise.resolve(true);
        });
    } if (gameType) { // allow all other game modes
      let cardId; let k; let
        v;
      const cardsToValidateAgainstInventory = [];
      const cardSkinsToValidateAgainstInventory = [];
      let basicsOnly = true;

      for (const card of Array.from(deck)) {
        cardId = card.id;
        const sdkCard = SDK.GameSession.getCardCaches().getCardById(cardId);
        if (sdkCard.rarityId !== SDK.Rarity.Fixed) {
          basicsOnly = false;
        }
        if ((sdkCard.factionId !== deckFactionId) && (sdkCard.factionId !== SDK.Factions.Neutral)) {
          Logger.module('UsersModule').debug(`isAllowedToUseDeck() -> found a card with faction ${sdkCard.factionId} that doesn't belong in a ${deckFactionId} faction deck - ${userId.blue}.`.yellow);
          return Promise.reject(new Errors.InvalidDeckError('Deck has cards from more than one faction'));
        }
        if (((sdkCard.rarityId !== SDK.Rarity.Fixed) && (sdkCard.rarityId !== SDK.Rarity.TokenUnit)) || sdkCard.getIsUnlockable()) {
          const cardSkinId = SDK.Cards.getCardSkinIdForCardId(cardId);
          if (cardSkinId != null) {
            // add skin to validate against inventory
            if (!_.contains(cardSkinsToValidateAgainstInventory, cardSkinId)) {
              cardSkinsToValidateAgainstInventory.push(cardSkinId);
            }

            // add unskinned card to validate against inventory if needed
            const unskinnedCardId = SDK.Cards.getNonSkinnedCardId(cardId);
            const unskinnedSDKCard = SDK.GameSession.getCardCaches().getIsSkinned(false).getCardById(unskinnedCardId);
            if ((unskinnedSDKCard.getRarityId() !== SDK.Rarity.Fixed) && (unskinnedSDKCard.getRarityId() !== SDK.Rarity.TokenUnit)) {
              cardsToValidateAgainstInventory.push(unskinnedCardId);
            }
          } else {
            // add card to validate against inventory
            cardsToValidateAgainstInventory.push(card.id);
          }
        }
      }

      // starter decks must contain all cards in level 0 faction starter deck
      // normal decks must match exact deck size
      const maxDeckSize = CONFIG.DECK_SIZE_INCLUDES_GENERAL ? CONFIG.MAX_DECK_SIZE : CONFIG.MAX_DECK_SIZE + 1;
      if (basicsOnly) {
        if (deck.length < CONFIG.MIN_BASICS_DECK_SIZE) {
          Logger.module('UsersModule').debug(`isAllowedToUseDeck() -> invalid starter deck (${deck.length}) - ${userId.blue}.`.yellow);
          return Promise.reject(new Errors.InvalidDeckError(`Starter decks must have at least ${CONFIG.MIN_BASICS_DECK_SIZE} cards!`));
        } if (deck.length > maxDeckSize) {
          Logger.module('UsersModule').debug(`isAllowedToUseDeck() -> invalid starter deck (${deck.length}) - ${userId.blue}.`.yellow);
          return Promise.reject(new Errors.InvalidDeckError(`Starter decks must not have more than ${maxDeckSize} cards!`));
        }
      } else if (deck.length !== maxDeckSize) {
        Logger.module('UsersModule').debug(`isAllowedToUseDeck() -> invalid deck length (${deck.length}) - ${userId.blue}.`.yellow);
        return Promise.reject(new Errors.InvalidDeckError(`Deck must have ${maxDeckSize} cards`));
      }

      // ensure that player has no more than 3 of a base card (normal + prismatic) in deck
      const cardCountsById = _.countBy(deck, (cardData) => Cards.getBaseCardId(cardData.id));
      for (k in cardCountsById) {
        v = cardCountsById[k];
        if (v > 3) {
          return Promise.reject(new Errors.InvalidDeckError('Deck has more than 3 of a card'));
        }
      }

      // Ensure that player doesn't have any cards that are in development, hidden in collection, and only one general
      const gameSessionCards = _.map(deck, (cardData) => {
        cardId = cardData.id;
        return SDK.GameSession.getCardCaches().getCardById(cardId);
      });
      let generalCount = 0;
      for (const gameSessionCard of Array.from(gameSessionCards)) {
        if (gameSessionCard instanceof Entity && gameSessionCard.getIsGeneral()) {
          generalCount += 1;
        }
        if (!gameSessionCard.getIsAvailable(null, forceValidation)) {
          Logger.module('UsersModule').error(`isAllowedToUseDeck() -> Deck has cards (${gameSessionCard.id}) that are not yet available - player ${userId.blue}.`.red);
          return Promise.reject(new Errors.NotFoundError('Deck has cards that are not yet available'));
        }
        if (gameSessionCard.getIsHiddenInCollection()) {
          Logger.module('UsersModule').error(`isAllowedToUseDeck() -> Deck has cards (${gameSessionCard.id}) that are in hidden to collection - player ${userId.blue}.`.red);
          return Promise.reject(new Errors.InvalidDeckError('Deck has cards that are in hidden to collection'));
        }
        if ((gameSessionCard.getIsLegacy() || (CardSetFactory.cardSetForIdentifier(gameSessionCard.getCardSetId()).isLegacy != null)) && (GameType.getGameFormatForGameType(gameType) === GameFormat.Standard)) {
          Logger.module('UsersModule').error(`isAllowedToUseDeck() -> Deck has cards (${gameSessionCard.id}) that are in LEGACY format but game mode is STANDARD format`);
          return Promise.reject(new Errors.InvalidDeckError('Game Mode is STANDARD but deck contains LEGACY card'));
        }
      }

      if (generalCount !== 1) {
        return Promise.reject(new Errors.InvalidDeckError(`Deck has ${generalCount} generals`));
      }

      // ensure that player has no more than 1 of a mythron card (normal + prismatic) in deck
      const mythronCardCountsById = _.countBy(gameSessionCards, (card) => {
        if (card.getRarityId() === SDK.Rarity.Mythron) {
          return Cards.getBaseCardId(card.getId());
        }
        return -1;
      });
      for (k in mythronCardCountsById) {
        v = mythronCardCountsById[k];
        if ((k !== '-1') && (v > 1)) {
          return Promise.reject(new Errors.InvalidDeckError('Deck has more than 1 of a mythron card'));
        }
      }

      // ensure that player has no more than 1 trial card total
      const trialCardCount = _.countBy(gameSessionCards, (card) => {
        const baseCardId = Cards.getBaseCardId(card.getId());
        if ([Cards.Faction1.RightfulHeir, Cards.Faction2.DarkHeart, Cards.Faction3.KeeperOfAges, Cards.Faction4.DemonOfEternity, Cards.Faction5.Dinomancer, Cards.Faction6.VanarQuest, Cards.Neutral.Singleton].includes(baseCardId)) {
          return 'trialCard';
        }
        return -1;
      });
      for (k in trialCardCount) {
        v = trialCardCount[k];
        if ((k !== '-1') && (v > 1)) {
          return Promise.reject(new Errors.InvalidDeckError('Deck has more than 1 total trial card'));
        }
      }

      // setup method to validate cards against user inventory
      const validateCards = function () {
        Logger.module('UsersModule').debug(`isAllowedToUseDeck() -> doesUserHaveCards -> ${cardsToValidateAgainstInventory.length} cards to validate - ${userId.blue}.`.green);
        // if we're playing basic cards only, mark deck as valid, and only check against inventory otherwise
        if (cardsToValidateAgainstInventory.length === 0) {
          return Promise.resolve(true);
        }
        return InventoryModule.isAllowedToUseCards(Promise.resolve(), knex, userId, cardsToValidateAgainstInventory);
      };

      // setup method to validate skins against user inventory
      const validateSkins = function () {
        Logger.module('UsersModule').debug(`isAllowedToUseDeck() -> doesUserHaveSkins -> ${cardSkinsToValidateAgainstInventory.length} skins to validate - ${userId.blue}.`.green);
        if (cardSkinsToValidateAgainstInventory.length === 0) {
          return Promise.resolve(true);
        }
        return InventoryModule.isAllowedToUseCosmetics(Promise.resolve(), knex, userId, cardSkinsToValidateAgainstInventory, SDK.CosmeticsTypeLookup.CardSkin);
      };

      return Promise.all([
        validateCards(),
        validateSkins(),
      ]);
    }

    return Promise.reject(new Error(`Unknown game type: ${gameType}`));
  }

  /**
	 * Creates a blank faction progression (0 XP) record for a user. This is used to mark a faction as "unlocked".
	 * @public
	 * @param	{String}	userId			User ID for which to update.
	 * @param	{String}	factionId 		Faction ID for which to update.
	 * @param	{String}	gameId			Game unique ID
	 * @param	{String}	gameType		Game type (see SDK.GameType)
	 * @param	{Moment}	systemTime		Pass in the current system time to use. Used only for testing.
	 * @return	{Promise}					Promise that will notify when complete.
	 */
  static createFactionProgressionRecord(userId, factionId, gameId, gameType, systemTime) {
    // userId must be defined
    if (!userId) {
      return Promise.reject(new Error(`Can not createFactionProgressionRecord(): invalid user ID - ${userId}`));
    }

    // factionId must be defined
    if (!factionId) {
      return Promise.reject(new Error(`Can not createFactionProgressionRecord(): invalid faction ID - ${factionId}`));
    }

    const MOMENT_NOW_UTC = systemTime || moment().utc();
    const this_obj = {};

    const txPromise = knex.transaction((tx) => Promise.resolve(tx('users').where('id', userId).first('id').forUpdate())
      .bind(this_obj)
      .then((userRow) => Promise.all([
        userRow,
        tx('user_faction_progression').where({ user_id: userId, faction_id: factionId }).first().forUpdate(),
      ])).spread(function (userRow, factionProgressionRow) {
        if (factionProgressionRow) {
          throw new Errors.AlreadyExistsError();
        }

        // faction progression row
        if (factionProgressionRow == null) { factionProgressionRow = { user_id: userId, faction_id: factionId }; }
        this.factionProgressionRow = factionProgressionRow;
        if (factionProgressionRow.xp == null) { factionProgressionRow.xp = 0; }
        if (factionProgressionRow.game_count == null) { factionProgressionRow.game_count = 0; }
        if (factionProgressionRow.unscored_count == null) { factionProgressionRow.unscored_count = 0; }
        if (factionProgressionRow.loss_count == null) { factionProgressionRow.loss_count = 0; }
        if (factionProgressionRow.win_count == null) { factionProgressionRow.win_count = 0; }
        if (factionProgressionRow.draw_count == null) { factionProgressionRow.draw_count = 0; }
        if (factionProgressionRow.single_player_win_count == null) { factionProgressionRow.single_player_win_count = 0; }
        if (factionProgressionRow.friendly_win_count == null) { factionProgressionRow.friendly_win_count = 0; }
        if (factionProgressionRow.xp_earned == null) { factionProgressionRow.xp_earned = 0; }
        factionProgressionRow.updated_at = MOMENT_NOW_UTC.toDate();
        factionProgressionRow.last_game_id = gameId;
        factionProgressionRow.level = SDK.FactionProgression.levelForXP(factionProgressionRow.xp);

        // reward row
        const rewardData = {
          id: generatePushId(),
          user_id: userId,
          reward_category: 'faction unlock',
          game_id: gameId,
          unlocked_faction_id: factionId,
          created_at: MOMENT_NOW_UTC.toDate(),
          is_unread: true,
        };

        return Promise.all([
          tx('user_faction_progression').insert(factionProgressionRow),
          tx('user_rewards').insert(rewardData),
          GamesModule._addRewardIdToUserGame(tx, userId, gameId, rewardData.id),
        ]);
      })
      .then(() => DuelystFirebase.connect().getRootRef())
      .then(function (rootRef) {
        delete this.factionProgressionRow.user_id;
        this.factionProgressionRow.updated_at = moment.utc(this.factionProgressionRow.updated_at).valueOf();
        return FirebasePromises.set(rootRef.child('user-faction-progression').child(userId).child(factionId).child('stats'), this.factionProgressionRow);
      })
      .then(() => SyncModule._bumpUserTransactionCounter(tx, userId))
      .timeout(10000)
      .catch(Promise.TimeoutError, (e) => {
        Logger.module('UsersModule').error(`createFactionProgressionRecord() -> ERROR, operation timeout for u:${userId} g:${gameId}`);
        throw e;
      })).bind(this_obj);

    return txPromise;
  }

  /**
	 * Update a user's per-faction progression metrics based on the outcome of a ranked game
	 * @public
	 * @param	{String}	userId			User ID for which to update.
	 * @param	{String}	factionId 		Faction ID for which to update.
	 * @param	{Boolean}	isWinner		Did the user win the game?
	 * @param	{String}	gameId			Game unique ID
	 * @param	{String}	gameType		Game type (see SDK.GameType)
	 * @param	{Boolean}	isUnscored		Should this game be scored or unscored (if a user conceded too early for example?)
	 * @param	{Boolean}	isDraw			Are we updating for a draw?
	 * @param	{Moment}	systemTime		Pass in the current system time to use. Used only for testing.
	 * @return	{Promise}					Promise that will notify when complete.
	 */
  static updateUserFactionProgressionWithGameOutcome(userId, factionId, isWinner, gameId, gameType, isUnscored, isDraw, systemTime) {
    // userId must be defined
    if (!userId) {
      return Promise.reject(new Error(`Can not updateUserFactionProgressionWithGameOutcome(): invalid user ID - ${userId}`));
    }

    // factionId must be defined
    if (!factionId) {
      return Promise.reject(new Error(`Can not updateUserFactionProgressionWithGameOutcome(): invalid faction ID - ${factionId}`));
    }

    const MOMENT_NOW_UTC = systemTime || moment().utc();
    const this_obj = {};

    var txPromise = knex.transaction((tx) => Promise.resolve(tx('users').first('id', 'is_bot').where('id', userId).forUpdate())
      .bind(this_obj)
      .then((userRow) => Promise.all([
        userRow,
        tx('user_faction_progression').where({ user_id: userId, faction_id: factionId }).first().forUpdate(),
      ])).spread(function (userRow, factionProgressionRow) {
        // Logger.module("UsersModule").debug "updateUserFactionProgressionWithGameOutcome() -> ACQUIRED LOCK ON #{userId}".yellow

        this.userRow = userRow;

        const allPromises = [];

        const needsInsert = _.isUndefined(factionProgressionRow);
        if (factionProgressionRow == null) { factionProgressionRow = { user_id: userId, faction_id: factionId }; }

        this.factionProgressionRow = factionProgressionRow;
        if (factionProgressionRow.xp == null) { factionProgressionRow.xp = 0; }
        if (factionProgressionRow.game_count == null) { factionProgressionRow.game_count = 0; }
        if (factionProgressionRow.unscored_count == null) { factionProgressionRow.unscored_count = 0; }
        if (factionProgressionRow.loss_count == null) { factionProgressionRow.loss_count = 0; }
        if (factionProgressionRow.win_count == null) { factionProgressionRow.win_count = 0; }
        if (factionProgressionRow.draw_count == null) { factionProgressionRow.draw_count = 0; }
        if (factionProgressionRow.single_player_win_count == null) { factionProgressionRow.single_player_win_count = 0; }
        if (factionProgressionRow.friendly_win_count == null) { factionProgressionRow.friendly_win_count = 0; }
        if (factionProgressionRow.level == null) { factionProgressionRow.level = 0; }

        // faction xp progression for single player and friendly games is capped at 10
        // levels are indexed from 0 so we check 9 here instead of 10
        if (((gameType === GameType.SinglePlayer) || (gameType === GameType.BossBattle) || (gameType === GameType.Friendly)) && (factionProgressionRow.level >= 9)) {
          throw new Errors.MaxFactionXPForSinglePlayerReachedError();
        }

        // grab the default xp earned for a win/loss
        //				xp_earned = if isWinner then SDK.FactionProgression.winXP else SDK.FactionProgression.lossXP
        let xp_earned = SDK.FactionProgression.xpEarnedForGameOutcome(isWinner, factionProgressionRow.level);

        // if this game should not earn XP for some reason (early concede for example)
        if (isUnscored) { xp_earned = 0; }

        const {
          xp,
        } = factionProgressionRow;
        const {
          game_count,
        } = factionProgressionRow;
        const {
          win_count,
        } = factionProgressionRow;

        const xp_cap = SDK.FactionProgression.totalXPForLevel(SDK.FactionProgression.maxLevel);

        // do not commit transaction if we're at the max level
        if (SDK.FactionProgression.levelForXP(xp) >= SDK.FactionProgression.maxLevel) {
          xp_earned = 0;
          // make sure user can't earn XP over cap
        } else if ((xp_cap - xp) < xp_earned) {
          xp_earned = xp_cap - xp;
        }

        factionProgressionRow.xp_earned = xp_earned;
        factionProgressionRow.updated_at = MOMENT_NOW_UTC.toDate();
        factionProgressionRow.last_game_id = gameId;

        if (isUnscored) {
          const {
            unscored_count,
          } = factionProgressionRow;
          factionProgressionRow.unscored_count += 1;
        } else {
          factionProgressionRow.xp = xp + xp_earned;
          factionProgressionRow.level = SDK.FactionProgression.levelForXP(factionProgressionRow.xp);
          factionProgressionRow.game_count += 1;
          if (isDraw) {
            factionProgressionRow.draw_count += 1;
          } else if (isWinner) {
            factionProgressionRow.win_count += 1;
            if ((gameType === GameType.SinglePlayer) || (gameType === GameType.BossBattle)) {
              factionProgressionRow.single_player_win_count += 1;
            }
            if (gameType === GameType.Friendly) {
              factionProgressionRow.friendly_win_count += 1;
            }
          } else {
            factionProgressionRow.loss_count += 1;
          }
        }

        // Logger.module("UsersModule").debug factionProgressionRow

        if (needsInsert) {
          allPromises.push(knex('user_faction_progression').insert(factionProgressionRow).transacting(tx));
        } else {
          allPromises.push(knex('user_faction_progression').where({ user_id: userId, faction_id: factionId }).update(factionProgressionRow).transacting(tx));
        }

        if (!isUnscored && (!this.factionProgressionRow.xp_earned > 0)) {
          Logger.module('UsersModule').debug(`updateUserFactionProgressionWithGameOutcome() -> F${factionId} MAX level reached`);

          // update the user game params
          this.updateUserGameParams = {
            faction_xp: this.factionProgressionRow.xp,
            faction_xp_earned: 0,
          };

          allPromises.push(knex('user_games').where({ user_id: userId, game_id: gameId }).update(this.updateUserGameParams).transacting(tx));
        } else {
          const level = SDK.FactionProgression.levelForXP(this.factionProgressionRow.xp);

          Logger.module('UsersModule').debug(`updateUserFactionProgressionWithGameOutcome() -> At F${factionId} L:${level} [${this.factionProgressionRow.xp}] earned ${this.factionProgressionRow.xp_earned} for G:${gameId}`);

          const progressData = {
            user_id: userId,
            faction_id: factionId,
            xp_earned: this.factionProgressionRow.xp_earned,
            is_winner: isWinner || false,
            is_draw: isDraw || false,
            game_id: gameId,
            created_at: MOMENT_NOW_UTC.toDate(),
            is_scored: !isUnscored,
          };

          this.updateUserGameParams = {
            faction_xp: this.factionProgressionRow.xp - this.factionProgressionRow.xp_earned,
            faction_xp_earned: this.factionProgressionRow.xp_earned,
          };

          allPromises.push(knex('user_faction_progression_events').insert(progressData).transacting(tx));
          allPromises.push(knex('user_games').where({ user_id: userId, game_id: gameId }).update(this.updateUserGameParams).transacting(tx));
        }

        return Promise.all(allPromises);
      })
      .then(function () {
        let factionName; let
          rewardRowData;
        let allPromises = [];

        if ((!isUnscored && this.factionProgressionRow) && SDK.FactionProgression.hasLeveledUp(this.factionProgressionRow.xp, this.factionProgressionRow.xp_earned)) {
          // Logger.module("UsersModule").debug "updateUserFactionProgressionWithGameOutcome() -> LEVELED up"

          factionName = SDK.FactionFactory.factionForIdentifier(factionId).devName;
          const level = SDK.FactionProgression.levelForXP(this.factionProgressionRow.xp);
          const rewardData = SDK.FactionProgression.rewardDataForLevel(factionId, level);

          this.rewardRows = [];

          if (rewardData != null) {
            rewardRowData = {
              id: generatePushId(),
              user_id: userId,
              reward_category: 'faction xp',
              reward_type: `${factionName} L${level}`,
              game_id: gameId,
              created_at: MOMENT_NOW_UTC.toDate(),
              is_unread: true,
            };

            this.rewardRows.push(rewardRowData);

            rewardData.created_at = MOMENT_NOW_UTC.valueOf();
            rewardData.level = level;

            // update inventory
            let earnRewardInventoryPromise = null;
            if (rewardData.gold != null) {
              rewardRowData.gold = rewardData.gold;

              // update wallet
              earnRewardInventoryPromise = InventoryModule.giveUserGold(txPromise, tx, userId, rewardData.gold, `${factionName} L${level}`, gameId);
            } else if (rewardData.spirit != null) {
              rewardRowData.spirit = rewardData.spirit;

              // update wallet
              earnRewardInventoryPromise = InventoryModule.giveUserSpirit(txPromise, tx, userId, rewardData.spirit, `${factionName} L${level}`, gameId);
            } else if (rewardData.cards != null) {
              const cardIds = [];
              _.each(rewardData.cards, (c) => _.times(c.count, () => cardIds.push(c.id)));

              rewardRowData.cards = cardIds;

              // give cards
              earnRewardInventoryPromise = InventoryModule.giveUserCards(txPromise, tx, userId, cardIds, 'faction xp', gameId, `${factionName} L${level}`);
            } else if (rewardData.booster_packs != null) {
              rewardRowData.spirit_orbs = rewardData.booster_packs;

              // TODO: what about more than 1 booster pack?
              earnRewardInventoryPromise = InventoryModule.addBoosterPackToUser(txPromise, tx, userId, 1, 'faction xp', `${factionName} L${level}`, { factionId, level, gameId });
            } else if (rewardData.emotes != null) {
              rewardRowData.cosmetics = [];

              // update emotes inventory
              const emotes_promises = [];
              for (const emote_id of Array.from(rewardData.emotes)) {
                rewardRowData.cosmetics.push(emote_id);
                allPromises.push(InventoryModule.giveUserCosmeticId(txPromise, tx, userId, emote_id, 'faction xp reward', rewardRowData.id, null, MOMENT_NOW_UTC));
              }

              earnRewardInventoryPromise = Promise.all(emotes_promises);
            }

            // resolve master promise whan reward is saved and inventory updated
            allPromises = allPromises.concat([
              knex('user_rewards').insert(rewardRowData).transacting(tx),
              earnRewardInventoryPromise,
              GamesModule._addRewardIdToUserGame(tx, userId, gameId, rewardRowData.id),
            ]);
          }
        }

        // let's see if we need to add any faction ribbons for this user
        const winCountForRibbons = this.factionProgressionRow.win_count - (this.factionProgressionRow.single_player_win_count + this.factionProgressionRow.friendly_win_count);
        if (isWinner && (winCountForRibbons > 0) && ((winCountForRibbons % 100) === 0) && !this.userRow.is_bot) {
          Logger.module('UsersModule').debug(`${`updateUserFactionProgressionWithGameOutcome() -> user ${userId.blue}`.green} game ${gameId} earned WIN RIBBON for faction ${factionId}`);

          const ribbonId = `f${factionId}_champion`;

          rewardRowData = {
            id: generatePushId(),
            user_id: userId,
            reward_category: 'ribbon',
            reward_type: `${factionName} wins`,
            game_id: gameId,
            created_at: MOMENT_NOW_UTC.toDate(),
            ribbons: [ribbonId],
            is_unread: true,
          };

          // looks like the user earned a faction ribbon!
          const ribbon = {
            user_id: userId,
            ribbon_id: ribbonId,
            game_id: gameId,
            created_at: MOMENT_NOW_UTC.toDate(),
          };

          this.ribbon = ribbon;

          allPromises = allPromises.concat([
            knex('user_ribbons').insert(ribbon).transacting(tx),
            knex('user_rewards').insert(rewardRowData).transacting(tx),
            GamesModule._addRewardIdToUserGame(tx, userId, gameId, rewardRowData.id),
          ]);
        }

        return Promise.all(allPromises);
      })
      .then(function () {
        // Update quests if a faction has leveled up
        if (SDK.FactionProgression.hasLeveledUp(this.factionProgressionRow.xp, this.factionProgressionRow.xp_earned)) {
          if (this.factionProgressionRow) { // and shouldProcessQuests # TODO: shouldprocessquests? also this may fail for people who already have faction lvl 10 by the time they reach this stage
            return QuestsModule.updateQuestProgressWithProgressedFactionData(txPromise, tx, userId, this.factionProgressionRow, MOMENT_NOW_UTC);
          }
        }

        // Not performing faction based quest update
        return Promise.resolve();
      })
      .then(() => DuelystFirebase.connect().getRootRef())
      .then(function (rootRef) {
        this.fbRootRef = rootRef;

        const allPromises = [];

        delete this.factionProgressionRow.user_id;
        this.factionProgressionRow.updated_at = moment.utc(this.factionProgressionRow.updated_at).valueOf();

        allPromises.push(FirebasePromises.set(rootRef.child('user-faction-progression').child(userId).child(factionId).child('stats'), this.factionProgressionRow));

        for (const key in this.updateUserGameParams) {
          const val = this.updateUserGameParams[key];
          allPromises.push(FirebasePromises.set(rootRef.child('user-games').child(userId).child(gameId).child(key), val));
        }

        if (this.ribbon) {
          let ribbonData = _.omit(this.ribbon, ['user_id']);
          ribbonData = DataAccessHelpers.restifyData(ribbonData);
          allPromises.push(FirebasePromises.safeTransaction(rootRef.child('user-ribbons').child(userId).child(ribbonData.ribbon_id), (data) => {
            if (data == null) { data = {}; }
            if (data.ribbon_id == null) { data.ribbon_id = ribbonData.ribbon_id; }
            data.updated_at = ribbonData.created_at;
            if (data.count == null) { data.count = 0; }
            data.count += 1;
            return data;
          }));
        }

        // if @.rewardRows
        // 	for reward in @.rewardRows
        // 		reward_id = reward.id
        // 		delete reward.user_id
        // 		delete reward.id
        // 		reward.created_at = moment.utc(reward.created_at).valueOf()
        // 		# push rewards to firebase tree
        // 		allPromises.push(FirebasePromises.set(rootRef.child("user-rewards").child(userId).child(reward_id),reward))

        return Promise.all(allPromises);
      })
      .then(() => SyncModule._bumpUserTransactionCounter(tx, userId))
      .catch(Errors.MaxFactionXPForSinglePlayerReachedError, (e) => tx.rollback(e))
      .timeout(10000)
      .catch(Promise.TimeoutError, (e) => {
        Logger.module('UsersModule').error(`updateUserFactionProgressionWithGameOutcome() -> ERROR, operation timeout for u:${userId} g:${gameId}`);
        throw e;
      })).bind(this_obj)
      .then(function () {
        // Update achievements if leveled up
        if (SDK.FactionProgression.hasLeveledUp(this.factionProgressionRow.xp, this.factionProgressionRow.xp_earned) || (this.factionProgressionRow.game_count === 1)) {
          Jobs.create('update-user-achievements', {
            name: 'Update User Faction Achievements',
            title: util.format('User %s :: Update Faction Achievements', userId),
            userId,
            factionProgressed: true,
          }).removeOnComplete(true).save();
        }

        Logger.module('UsersModule').debug(`updateUserFactionProgressionWithGameOutcome() -> user ${userId.blue}`.green + ` game ${gameId} (${this.factionProgressionRow.game_count}) faction progression recorded. Unscored: ${(isUnscored != null ? isUnscored.toString().cyan : undefined)}`.green);
        return this.factionProgressionRow;
      }).catch(Errors.MaxFactionXPForSinglePlayerReachedError, (e) => {
        Logger.module('UsersModule').debug(`${`updateUserFactionProgressionWithGameOutcome() -> user ${userId.blue}`.green} game ${gameId} for faction ${factionId} not recorded. MAX LVL 10 for single player games reached.`);
        return null;
      })
      .finally(() => GamesModule.markClientGameJobStatusAsComplete(userId, gameId, 'faction_progression'));
    return txPromise;
  }

  /**
	 * Update a user's progression metrics based on the outcome of a ranked game
	 * @public
	 * @param	{String}	userId		User ID for which to update.
	 * @param	{Boolean}	isWinner	Did the user win the game?
	 * @param	{String}	gameId		Game unique ID
	 * @param	{String}	gameType	Game type (see SDK.GameType)
	 * @param	{Boolean}	isUnscored	Should this game be scored or unscored if the user, for example, conceded too early?
	 * @param	{Boolean}	isDraw	is this game a draw?
	 * @param	{Moment}	systemTime	Pass in the current system time to use. Used only for testing.
	 * @return	{Promise}				Promise that will notify when complete.
	 */
  static updateUserProgressionWithGameOutcome(userId, opponentId, isWinner, gameId, gameType, isUnscored, isDraw, systemTime) {
    // userId must be defined
    if (!userId) {
      return Promise.reject(new Error(`Can not updateUserProgressionWithGameOutcome(): invalid user ID - ${userId}`));
    }

    // userId must be defined
    if (!gameId) {
      return Promise.reject(new Error(`Can not updateUserProgressionWithGameOutcome(): invalid game ID - ${gameId}`));
    }

    const MOMENT_NOW_UTC = systemTime || moment().utc();
    const this_obj = {};

    var txPromise = knex.transaction((tx) => {
      const start_of_day_int = parseInt(moment(MOMENT_NOW_UTC).startOf('day').utc().format('YYYYMMDD'));

      return Promise.resolve(tx('users').first('id').where('id', userId).forUpdate())
        .bind(this_obj)
        .then((userRow) => Promise.all([
          userRow,
          tx('user_progression').where('user_id', userId).first().forUpdate(),
          tx('user_progression_days').where({ user_id: userId, date: start_of_day_int }).first().forUpdate(),
        ])).spread(function (userRow, progressionRow, progressionDayRow) {
          // Logger.module("UsersModule").debug "updateUserProgressionWithGameOutcome() -> ACQUIRED LOCK ON #{userId}".yellow

          // ######
          // ######
          // ######
          // ######
          // ######
          // ######
          // ######

          const allPromises = [];

          let hasReachedDailyPlayRewardMaxium = false;
          const hasReachedDailyWinRewardMaxium = false;
          this.hasReachedDailyWinCountBonusLimit = false;
          let canEarnFirstWinOfTheDayReward = true;

          this.progressionDayRow = progressionDayRow || { user_id: userId, date: start_of_day_int };
          if (this.progressionDayRow.game_count == null) { this.progressionDayRow.game_count = 0; }
          if (this.progressionDayRow.unscored_count == null) { this.progressionDayRow.unscored_count = 0; }
          this.progressionDayRow.game_count += 1;

          // controls for daily maximum of play rewards
          if ((this.progressionDayRow.game_count - this.progressionDayRow.unscored_count) > UsersModule.DAILY_REWARD_GAME_CAP) {
            hasReachedDailyPlayRewardMaxium = true;
          }

          // # controls for daily maximum of play rewards
          // if counterData.win_count > UsersModule.DAILY_REWARD_WIN_CAP
          // 	hasReachedDailyWinRewardMaxium = true

          if (isDraw) {
            if (this.progressionDayRow.draw_count == null) { this.progressionDayRow.draw_count = 0; }
            this.progressionDayRow.draw_count += 1;
          } else if (isWinner) {
            // iterate win count
            if (this.progressionDayRow.win_count == null) { this.progressionDayRow.win_count = 0; }
            this.progressionDayRow.win_count += 1;

            if (this.progressionDayRow.win_count > 1) {
              canEarnFirstWinOfTheDayReward = false;
            }

            // @.hasReachedDailyWinCountBonusLimit is disabled
            //					if @.progressionDayRow.win_count > 14
            //						@.hasReachedDailyWinCountBonusLimit = true
          } else {
            // iterate loss count
            if (this.progressionDayRow.loss_count == null) { this.progressionDayRow.loss_count = 0; }
            this.progressionDayRow.loss_count += 1;
          }

          // if it's an unscored game, iterate unscored counter
          if (isUnscored) {
            this.progressionDayRow.unscored_count += 1;
          }

          if (progressionDayRow != null) {
            allPromises.push(knex('user_progression_days').where({ user_id: userId, date: start_of_day_int }).update(this.progressionDayRow).transacting(tx));
          } else {
            allPromises.push(knex('user_progression_days').insert(this.progressionDayRow).transacting(tx));
          }

          // ######
          // ######
          // ######
          // ######
          // ######
          // ######
          // ######

          this.hasEarnedWinReward = false;
          this.hasEarnedPlayReward = false;
          this.hasEarnedFirstWinOfTheDayReward = false;

          this.progressionRow = progressionRow || { user_id: userId };
          this.progressionRow.last_opponent_id = opponentId;

          // record total game count
          if (this.progressionRow.game_count == null) { this.progressionRow.game_count = 0; }
          if (this.progressionRow.unscored_count == null) { this.progressionRow.unscored_count = 0; }
          this.progressionRow.last_game_id = gameId || null;
          this.progressionRow.updated_at = MOMENT_NOW_UTC.toDate();

          // initialize last award records
          if (this.progressionRow.last_awarded_game_count == null) { this.progressionRow.last_awarded_game_count = 0; }
          if (this.progressionRow.last_awarded_win_count == null) { this.progressionRow.last_awarded_win_count = 0; }
          const last_daily_win_at = this.progressionRow.last_daily_win_at || 0;

          let play_count_reward_progress = 0;
          let win_count_reward_progress = 0;

          if (isUnscored) {
            this.progressionRow.unscored_count += 1;

            // mark all rewards as false
            this.hasEarnedWinReward = false;
            this.hasEarnedPlayReward = false;
            this.hasEarnedFirstWinOfTheDayReward = false;
          } else {
            this.progressionRow.game_count += 1;

            if (!hasReachedDailyPlayRewardMaxium) {
              play_count_reward_progress = this.progressionRow.game_count - this.progressionRow.last_awarded_game_count;

              if ((this.progressionRow.game_count > 0) && (play_count_reward_progress > 0) && ((play_count_reward_progress % 4) === 0)) {
                this.progressionRow.last_awarded_game_count = this.progressionRow.game_count;
                this.hasEarnedPlayReward = true;
              } else {
                this.hasEarnedPlayReward = false;
              }
            } else {
              this.progressionRow.last_awarded_game_count = this.progressionRow.game_count;
              this.progressionRow.play_awards_last_maxed_at = MOMENT_NOW_UTC.toDate();
              this.hasEarnedPlayReward = false;
            }

            if (isDraw) {
              if (this.progressionRow.draw_count == null) { this.progressionRow.draw_count = 0; }
              this.progressionRow.draw_count += 1;
            } else if (isWinner) {
              // set loss streak to 0
              this.progressionRow.loss_streak = 0;

              // is this the first win of the day?
              const hours_since_last_win = MOMENT_NOW_UTC.diff(last_daily_win_at, 'hours');
              if (hours_since_last_win >= UsersModule.DAILY_WIN_CYCLE_HOURS) {
                this.hasEarnedFirstWinOfTheDayReward = true;
                this.progressionRow.last_daily_win_at = MOMENT_NOW_UTC.toDate();
              } else {
                this.hasEarnedFirstWinOfTheDayReward = false;
              }

              // iterate win count
              if (this.progressionRow.win_count == null) { this.progressionRow.win_count = 0; }
              this.progressionRow.win_count += 1;
              // iterate win streak
              if (gameType !== GameType.Casual) {
                if (this.progressionRow.win_streak == null) { this.progressionRow.win_streak = 0; }
                this.progressionRow.win_streak += 1;
              }
              // mark last win time
              this.progressionRow.last_win_at = MOMENT_NOW_UTC.toDate();

              if (!hasReachedDailyWinRewardMaxium) {
                win_count_reward_progress = this.progressionRow.win_count - this.progressionRow.last_awarded_win_count;

                // if we've had 3 wins since last award, the user has earned an award
                if ((this.progressionRow.win_count - this.progressionRow.last_awarded_win_count) >= CONFIG.WINS_REQUIRED_FOR_WIN_REWARD) {
                  this.hasEarnedWinReward = true;
                  this.progressionRow.last_awarded_win_count_at = MOMENT_NOW_UTC.toDate();
                  this.progressionRow.last_awarded_win_count = this.progressionRow.win_count;
                } else {
                  this.hasEarnedWinReward = false;
                }
              } else {
                this.progressionRow.last_awarded_win_count_at = MOMENT_NOW_UTC.toDate();
                this.progressionRow.win_awards_last_maxed_at = MOMENT_NOW_UTC.toDate();
                this.progressionRow.last_awarded_win_count = this.progressionRow.win_count;
                this.hasEarnedWinReward = false;
              }
            } else {
              // iterate loss count
              if (this.progressionRow.loss_count == null) { this.progressionRow.loss_count = 0; }
              this.progressionRow.loss_count += 1;

              // only iterate loss streak for scored games
              // NOTE: control flow should never allow this to be reached for unscored, but adding this just in case someone moves code around :)
              if (!isUnscored) {
                if (this.progressionRow.loss_streak == null) { this.progressionRow.loss_streak = 0; }
                this.progressionRow.loss_streak += 1;
              }

              if (gameType !== GameType.Casual) {
                // reset win streak
                this.progressionRow.win_streak = 0;
              }
            }
          }

          if (progressionRow != null) {
            allPromises.push(knex('user_progression').where({ user_id: userId }).update(this.progressionRow).transacting(tx));
          } else {
            allPromises.push(knex('user_progression').insert(this.progressionRow).transacting(tx));
          }

          this.updateUserGameParams = {
            is_daily_win:	this.hasEarnedWinReward,
            play_count_reward_progress,
            win_count_reward_progress,
            has_maxed_play_count_rewards:	hasReachedDailyPlayRewardMaxium,
            has_maxed_win_count_rewards:	hasReachedDailyWinRewardMaxium,
          };
          allPromises.push(knex('user_games').where({ user_id: userId, game_id: gameId }).update(this.updateUserGameParams).transacting(tx));

          return Promise.all(allPromises);
        })
        .then(function () {
          const {
            hasEarnedWinReward,
          } = this;
          const {
            hasEarnedPlayReward,
          } = this;
          const {
            hasEarnedFirstWinOfTheDayReward,
          } = this;

          // let's set up
          const promises = [];
          this.rewards = [];

          // if the game is "unscored", assume there are NO rewards
          // otherwise, the game counter rewards might fire multiple times since game_count is not updated for unscored games
          if (!isUnscored) {
            let rewardData;
            if (hasEarnedFirstWinOfTheDayReward) {
              Logger.module('UsersModule').debug(`updateUserProgressionWithGameOutcome() -> user ${userId.blue} HAS earned a FIRST-WIN-OF-THE-DAY reward at ${this.progressionRow.game_count} games!`);

              // set up reward data
              rewardData = {
                id: generatePushId(),
                user_id: userId,
                game_id: gameId,
                reward_category: 'progression',
                reward_type: 'daily win',
                gold: CONFIG.FIRST_WIN_OF_DAY_GOLD_REWARD,
                created_at: MOMENT_NOW_UTC.toDate(),
                is_unread: true,
              };

              // add it to the rewards array
              this.rewards.push(rewardData);

              // add the promise to our list of reward promises
              promises.push(knex('user_rewards').insert(rewardData).transacting(tx));
              promises.push(InventoryModule.giveUserGold(txPromise, tx, userId, rewardData.gold, rewardData.reward_type));
              promises.push(GamesModule._addRewardIdToUserGame(tx, userId, gameId, rewardData.id));
            }

            // if hasEarnedPlayReward

            // 	Logger.module("UsersModule").debug "updateUserProgressionWithGameOutcome() -> user #{userId.blue} HAS earned a PLAY-COUNT reward at #{@.progressionRow["game_count"]} games!"

            // 	# set up reward data
            // 	rewardData = {
            // 		id:generatePushId()
            // 		user_id:userId
            // 		game_id:gameId
            // 		reward_category:"progression"
            // 		reward_type:"play count"
            // 		gold:10
            // 		created_at:MOMENT_NOW_UTC.toDate()
            // 		is_unread:true
            // 	}

            // 	# add it to the rewards array
            // 	@.rewards.push(rewardData)

            // 	# add the promise to our list of reward promises
            // 	promises.push(knex("user_rewards").insert(rewardData).transacting(tx))
            // 	promises.push(InventoryModule.giveUserGold(txPromise,tx,userId,rewardData.gold,rewardData.reward_type))
            // 	promises.push(GamesModule._addRewardIdToUserGame(tx,userId,gameId,rewardData.id))

            // if @.progressionRow["game_count"] == 3 and not isUnscored

            // 	Logger.module("UsersModule").debug "updateUserProgressionWithGameOutcome() -> user #{userId.blue} HAS earned a FIRST-3-GAMES reward!"

            // 	# set up reward data
            // 	rewardData = {
            // 		id:generatePushId()
            // 		user_id:userId
            // 		game_id:gameId
            // 		reward_category:"progression"
            // 		reward_type:"first 3 games"
            // 		gold:100
            // 		created_at:MOMENT_NOW_UTC.toDate()
            // 		is_unread:true
            // 	}

            // 	# add it to the rewards array
            // 	@.rewards.push(rewardData)

            // 	# add the promise to our list of reward promises
            // 	promises.push(knex("user_rewards").insert(rewardData).transacting(tx))
            // 	promises.push(InventoryModule.giveUserGold(txPromise,tx,userId,rewardData.gold,rewardData.reward_type))
            // 	promises.push(GamesModule._addRewardIdToUserGame(tx,userId,gameId,rewardData.id))

            // if @.progressionRow["game_count"] == 10 and not isUnscored

            // 	Logger.module("UsersModule").debug "updateUserProgressionWithGameOutcome() -> user #{userId.blue} HAS earned a FIRST-10-GAMES reward!"

            // 	# set up reward data
            // 	reward = {
            // 		type:"first 10 games"
            // 		gold_amount:100
            // 		created_at:MOMENT_NOW_UTC.toDate()
            // 		is_unread:true
            // 	}

            // 	# set up reward data
            // 	rewardData = {
            // 		id:generatePushId()
            // 		user_id:userId
            // 		game_id:gameId
            // 		reward_category:"progression"
            // 		reward_type:"first 10 games"
            // 		gold:100
            // 		created_at:MOMENT_NOW_UTC.toDate()
            // 		is_unread:true
            // 	}

            // 	# add it to the rewards array
            // 	@.rewards.push(rewardData)

            // 	# add the promise to our list of reward promises
            // 	promises.push(knex("user_rewards").insert(rewardData).transacting(tx))
            // 	promises.push(InventoryModule.giveUserGold(txPromise,tx,userId,rewardData.gold,rewardData.reward_type))
            // 	promises.push(GamesModule._addRewardIdToUserGame(tx,userId,gameId,rewardData.id))

            if (hasEarnedWinReward) {
              let gold_amount = CONFIG.WIN_BASED_GOLD_REWARD;
              // hasReachedDailyWinCountBonusLimit is disabled
              if (this.hasReachedDailyWinCountBonusLimit) {
                gold_amount = 5;
              }

              Logger.module('UsersModule').debug(`updateUserProgressionWithGameOutcome() -> user ${userId.blue} HAS earned a ${gold_amount}G WIN-COUNT reward!`);

              // set up reward data
              rewardData = {
                id: generatePushId(),
                user_id: userId,
                game_id: gameId,
                reward_category: 'progression',
                reward_type: 'win count',
                gold: gold_amount,
                created_at: MOMENT_NOW_UTC.toDate(),
                is_unread: true,
              };

              // add it to the rewards array
              this.rewards.push(rewardData);

              // add the promise to our list of reward promises
              promises.push(knex('user_rewards').insert(rewardData).transacting(tx));
              promises.push(InventoryModule.giveUserGold(txPromise, tx, userId, rewardData.gold, rewardData.reward_type));
              promises.push(GamesModule._addRewardIdToUserGame(tx, userId, gameId, rewardData.id));
            }

            this.codexChapterIdsEarned = SDK.Codex.chapterIdsAwardedForGameCount(this.progressionRow.game_count);

            if (this.codexChapterIdsEarned && (this.codexChapterIdsEarned.length !== 0)) {
              Logger.module('UsersModule').debug(`updateUserProgressionWithGameOutcome() -> user ${userId.blue} HAS earned codex chapters ${this.codexChapterIdsEarned} reward!`);
              for (const codexChapterIdEarned of Array.from(this.codexChapterIdsEarned)) {
                // set up reward data
                rewardData = {
                  id: generatePushId(),
                  user_id: userId,
                  game_id: gameId,
                  reward_category: 'codex',
                  reward_type: 'game count',
                  codex_chapter: codexChapterIdEarned,
                  created_at: MOMENT_NOW_UTC.toDate(),
                  is_unread: true,
                };

                promises.push(InventoryModule.giveUserCodexChapter(txPromise, tx, userId, codexChapterIdEarned, MOMENT_NOW_UTC));
                promises.push(knex('user_rewards').insert(rewardData).transacting(tx));
                promises.push(GamesModule._addRewardIdToUserGame(tx, userId, gameId, rewardData.id));
              }
            }

            return Promise.all(promises);
          }
        })
        .then(() => DuelystFirebase.connect().getRootRef())
        .then(function (rootRef) {
          this.fbRootRef = rootRef;

          const allPromises = [];

          delete this.progressionRow.user_id;
          delete this.progressionRow.last_opponent_id;

          if (this.progressionRow.last_win_at) { this.progressionRow.last_win_at = moment.utc(this.progressionRow.last_win_at).valueOf(); }
          if (this.progressionRow.last_daily_win_at) { this.progressionRow.last_daily_win_at = moment.utc(this.progressionRow.last_daily_win_at).valueOf(); }
          if (this.progressionRow.last_awarded_win_count_at) { this.progressionRow.last_awarded_win_count_at = moment.utc(this.progressionRow.last_awarded_win_count_at).valueOf(); }
          if (this.progressionRow.play_awards_last_maxed_at) { this.progressionRow.play_awards_last_maxed_at = moment.utc(this.progressionRow.play_awards_last_maxed_at).valueOf(); }
          if (this.progressionRow.win_awards_last_maxed_at) { this.progressionRow.win_awards_last_maxed_at = moment.utc(this.progressionRow.win_awards_last_maxed_at).valueOf(); }
          if (this.progressionRow.updated_at) { this.progressionRow.updated_at = moment.utc().valueOf(this.progressionRow.updated_at); }

          allPromises.push(FirebasePromises.set(rootRef.child('user-progression').child(userId).child('game-counter'), this.progressionRow));

          for (const key in this.updateUserGameParams) {
            const val = this.updateUserGameParams[key];
            allPromises.push(FirebasePromises.set(rootRef.child('user-games').child(userId).child(gameId).child(key), val));
          }

          // for reward in @.rewards

          // 	rewardId = reward.id
          // 	delete reward.id
          // 	delete reward.user_id
          // 	if reward.created_at then moment.utc().valueOf(reward.created_at)

          // 	allPromises.push FirebasePromises.set(rootRef.child("user-rewards").child(userId).child(rewardId),reward)

          return Promise.all(allPromises);
        })
        .then(() => SyncModule._bumpUserTransactionCounter(tx, userId))
        .timeout(10000)
        .catch(Promise.TimeoutError, (e) => {
          Logger.module('UsersModule').error(`updateUserProgressionWithGameOutcome() -> ERROR, operation timeout for u:${userId} g:${gameId}`);
          throw e;
        });
    }).bind(this_obj)
      .then(function () { return Logger.module('UsersModule').debug(`updateUserProgressionWithGameOutcome() -> user ${userId.blue}`.green + ` game ${gameId} G:${this.progressionRow.game_count} W:${this.progressionRow.win_count} L:${this.progressionRow.loss_count} U:${this.progressionRow.unscored_count} progression recorded. Unscored: ${(isUnscored != null ? isUnscored.toString().cyan : undefined)}`.green); })
      .finally(() => GamesModule.markClientGameJobStatusAsComplete(userId, gameId, 'progression'));

    return txPromise;
  }

  /**
	* Update a user's boss progression outcome of a boss battle
	* @public
	* @param	{String}	userId		User ID for which to update.
	* @param	{Boolean}	isWinner	Did the user win the game?
	* @param	{String}	gameId		Game unique ID
	* @param	{String}	gameType	Game type (see SDK.GameType)
	* @param	{Boolean}	isUnscored	Should this game be scored or unscored if the user, for example, conceded too early?
	* @param	{Boolean}	isDraw	is this game a draw?
  * @param {Object} gameSessionData data for the game played
	* @param	{Moment}	systemTime	Pass in the current system time to use. Used only for testing.
	* @return	{Promise}				Promise that will notify when complete.
	*/
  static updateUserBossProgressionWithGameOutcome(userId, opponentId, isWinner, gameId, gameType, isUnscored, isDraw, gameSessionData, systemTime) {
    // userId must be defined
    if (!userId) {
      return Promise.reject(new Error(`Can not updateUserBossProgressionWithGameOutcome(): invalid user ID - ${userId}`));
    }

    // userId must be defined
    if (!gameId) {
      return Promise.reject(new Error(`Can not updateUserBossProgressionWithGameOutcome(): invalid game ID - ${gameId}`));
    }

    if ((gameType == null) || (gameType !== SDK.GameType.BossBattle)) {
      return Promise.reject(new Error(`Can not updateUserBossProgressionWithGameOutcome(): invalid game game type - ${gameType}`));
    }

    if (!isWinner) {
      return Promise.resolve(false);
    }

    // Oppenent general must be part of the boss faction
    const opponentPlayerSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameSessionData, opponentId);
    const bossId = opponentPlayerSetupData != null ? opponentPlayerSetupData.generalId : undefined;
    const sdkBossData = SDK.GameSession.getCardCaches().getCardById(bossId);

    if (((bossId == null)) || ((sdkBossData == null)) || (sdkBossData.getFactionId() !== SDK.Factions.Boss)) {
      return Promise.reject(new Error(`Can not updateUserBossProgressionWithGameOutcome(): invalid boss ID - ${gameId}`));
    }

    const MOMENT_NOW_UTC = systemTime || moment().utc();
    const this_obj = {};
    this_obj.rewards = [];

    var txPromise = knex.transaction((tx) => Promise.resolve(tx('users').first('id').where('id', userId).forUpdate())
      .bind(this_obj)
      .then(function (userRow) {
        this.userRow = userRow;
        return DuelystFirebase.connect().getRootRef();
      }).then(function (fbRootRef) {
        this.fbRootRef = fbRootRef;

        const bossEventsRef = this.fbRootRef.child('boss-events');
        return FirebasePromises.once(bossEventsRef, 'value');
      })
      .then(function (bossEventsSnapshot) {
        const bossEventsData = bossEventsSnapshot.val();
        // data will have
        // event-id :
        //   event_id
        //		boss_id
        //   event_start
        //   event_end
        //   valid_end (event_end + 30 minute buffer)
        this.matchingEventData = null;
        for (const eventId in bossEventsData) {
          const eventData = bossEventsData[eventId];
          if ((eventData.boss_id == null) || (parseInt(eventData.boss_id) !== bossId)) {
            continue;
          }
          if ((eventData.event_start == null) || (eventData.event_start > MOMENT_NOW_UTC.valueOf())) {
            continue;
          }
          if ((eventData.valid_end == null) || (eventData.valid_end < MOMENT_NOW_UTC.valueOf())) {
            continue;
          }

          // Reaching here means we have a matching event
          this.matchingEventData = eventData;
          this.matchingEventId = eventData.event_id;
          break;
        }

        if ((this.matchingEventData == null)) {
          Logger.module('UsersModule').debug(`updateUserBossProgressionWithGameOutcome() -> no matching boss event id for user ${userId} in game ${gameId}.`.red);
          return Promise.reject(new Error(`Can not updateUserBossProgressionWithGameOutcome(): No matching boss event - ${gameId}`));
        }
      })
      .then(function () {
        return Promise.all([
          this.userRow,
          tx('user_bosses_defeated').where('user_id', userId).andWhere('boss_id', bossId).andWhere('boss_event_id', this.matchingEventId)
            .first(),
        ]);
      })
      .spread(function (userRow, userBossDefeatedRow) {
        if (userBossDefeatedRow != null) {
          return Promise.resolve();
        }

        const allPromises = [];

        // Insert defeated boss row
        const defeatedBossData = {
          user_id: userId,
          boss_id: bossId,
          game_id: gameId,
          boss_event_id: this.matchingEventId,
          defeated_at: MOMENT_NOW_UTC.toDate(),
        };
        allPromises.push(tx('user_bosses_defeated').insert(defeatedBossData));

        Logger.module('UsersModule').debug(`updateUserBossProgressionWithGameOutcome() -> user ${userId.blue} HAS earned a BOSS BATTLE reward!`);

        // set up reward data
        const rewardData = {
          id: generatePushId(),
          user_id: userId,
          game_id: gameId,
          reward_category: 'progression',
          reward_type: 'boss battle',
          spirit_orbs: SDK.CardSet.Core,
          created_at: MOMENT_NOW_UTC.toDate(),
          is_unread: true,
        };

        // add it to the rewards array
        this.rewards.push(rewardData);

        // add the promise to our list of reward promises
        allPromises.push(knex('user_rewards').insert(rewardData).transacting(tx));
        //				allPromises.push(InventoryModule.giveUserGold(txPromise,tx,userId,rewardData.gold,rewardData.reward_type))
        allPromises.push(InventoryModule.addBoosterPackToUser(txPromise, tx, userId, rewardData.spirit_orbs, 'boss battle', this.matchingEventId));
        allPromises.push(GamesModule._addRewardIdToUserGame(tx, userId, gameId, rewardData.id));

        return Promise.all(allPromises);
      })
      .then(() => DuelystFirebase.connect().getRootRef())
      .then(function (rootRef) {
        this.fbRootRef = rootRef;

        const allPromises = [];

        // Insert defeated boss row
        const defeatedBossFBData = {
          boss_id: bossId,
          boss_event_id: this.matchingEventId,
          defeated_at: MOMENT_NOW_UTC.valueOf(),
        };

        allPromises.push(FirebasePromises.set(rootRef.child('user-bosses-defeated').child(userId).child(bossId), defeatedBossFBData));

        return Promise.all(allPromises);
      })
      .then(() => SyncModule._bumpUserTransactionCounter(tx, userId))
      .timeout(10000)
      .catch(Promise.TimeoutError, (e) => {
        Logger.module('UsersModule').error(`updateUserBossProgressionWithGameOutcome() -> ERROR, operation timeout for u:${userId} g:${gameId}`);
        throw e;
      })).bind(this_obj)
      .then(() => Logger.module('UsersModule').debug(`updateUserBossProgressionWithGameOutcome() -> user ${userId.blue}`.green + ` game ${gameId} boss id:${bossId}`.green))
      .finally(() => GamesModule.markClientGameJobStatusAsComplete(userId, gameId, 'progression'));

    return txPromise;
  }

  /**
	 * Update a user's game counters
	 * @public
	 * @param	{String}			userId		User ID for which to update.
	 * @param	{Number}			factionId 	Faction ID for which to update.
	 * @param	{Number}			generalId 	General ID for which to update.
	 * @param	{Boolean}			isWinner	Did the user win the game?
	 * @param	{String}			gameType	Game type (see SDK.GameType)
	 * @param	{Boolean}			isUnscored	Should this game be scored or unscored if the user, for example, conceded too early?
	 * @param	{Boolean}			isDraw	was game a draw?
	 * @param	{Moment}			systemTime	Pass in the current system time to use. Used only for testing.
	 * @return	{Promise}						Promise that will notify when complete.
	 */
  static updateGameCounters(userId, factionId, generalId, isWinner, gameType, isUnscored, isDraw, systemTime) {
    // userId must be defined
    if (!userId) {
      return Promise.reject(new Error(`Can not updateUserProgressionWithGameOutcome(): invalid user ID - ${userId}`));
    }

    const MOMENT_NOW_UTC = systemTime || moment().utc();
    const MOMENT_SEASON_START_UTC = MOMENT_NOW_UTC.clone().startOf('month');
    const this_obj = {};

    return knex.transaction((tx) => Promise.resolve(tx('users').first('id').where('id', userId).forUpdate())
      .bind(this_obj)
      .then((userRow) => Promise.all([
        userRow,
        tx('user_game_counters').where({
          user_id:	userId,
          game_type:	gameType,
        }).first().forUpdate(),
        tx('user_game_faction_counters').where({
          user_id:	userId,
          faction_id:	factionId,
          game_type:	gameType,
        }).first().forUpdate(),
        tx('user_game_general_counters').where({
          user_id:	userId,
          general_id:	generalId,
          game_type:	gameType,
        }).first().forUpdate(),
        tx('user_game_season_counters').where({
          user_id:	userId,
          season_starting_at:	MOMENT_SEASON_START_UTC.toDate(),
          game_type:	gameType,
        }).first().forUpdate(),
      ])).spread(function (userRow, counterRow, factionCounterRow, generalCounterRow, seasonCounterRow) {
        const allPromises = [];

        // game type counter
        const counter = DataAccessHelpers.updateCounterWithGameOutcome(counterRow, isWinner, isDraw, isUnscored);
        counter.user_id = userId;
        counter.game_type = gameType;
        if (counter.created_at == null) { counter.created_at = MOMENT_NOW_UTC.toDate(); }
        counter.updated_at = MOMENT_NOW_UTC.toDate();

        if (counterRow) {
          allPromises.push(knex('user_game_counters').where({
            user_id:	userId,
            game_type:	gameType,
          }).update(counter).transacting(tx));
        } else {
          allPromises.push(knex('user_game_counters').insert(counter).transacting(tx));
        }

        // faction counter
        const factionCounter = DataAccessHelpers.updateCounterWithGameOutcome(factionCounterRow, isWinner, isDraw, isUnscored);
        factionCounter.user_id = userId;
        factionCounter.faction_id = factionId;
        factionCounter.game_type = gameType;
        if (factionCounter.created_at == null) { factionCounter.created_at = MOMENT_NOW_UTC.toDate(); }
        factionCounter.updated_at = MOMENT_NOW_UTC.toDate();

        if (factionCounterRow) {
          allPromises.push(knex('user_game_faction_counters').where({
            user_id:	userId,
            faction_id:	factionId,
            game_type:	gameType,
          }).update(factionCounter).transacting(tx));
        } else {
          allPromises.push(knex('user_game_faction_counters').insert(factionCounter).transacting(tx));
        }

        // general counter
        const generalCounter = DataAccessHelpers.updateCounterWithGameOutcome(generalCounterRow, isWinner, isDraw, isUnscored);
        generalCounter.user_id = userId;
        generalCounter.general_id = generalId;
        generalCounter.game_type = gameType;
        if (generalCounter.created_at == null) { generalCounter.created_at = MOMENT_NOW_UTC.toDate(); }
        generalCounter.updated_at = MOMENT_NOW_UTC.toDate();

        if (generalCounterRow) {
          allPromises.push(knex('user_game_general_counters').where({
            user_id:	userId,
            general_id:	generalId,
            game_type:	gameType,
          }).update(generalCounter).transacting(tx));
        } else {
          allPromises.push(knex('user_game_general_counters').insert(generalCounter).transacting(tx));
        }

        // season counter
        const seasonCounter = DataAccessHelpers.updateCounterWithGameOutcome(seasonCounterRow, isWinner, isDraw, isUnscored);
        seasonCounter.user_id = userId;
        seasonCounter.game_type = gameType;
        if (seasonCounter.season_starting_at == null) { seasonCounter.season_starting_at = MOMENT_SEASON_START_UTC.toDate(); }
        if (seasonCounter.created_at == null) { seasonCounter.created_at = MOMENT_NOW_UTC.toDate(); }
        seasonCounter.updated_at = MOMENT_NOW_UTC.toDate();

        if (seasonCounterRow) {
          allPromises.push(knex('user_game_season_counters').where({
            user_id:	userId,
            season_starting_at:	MOMENT_SEASON_START_UTC.toDate(),
            game_type:	gameType,
          }).update(seasonCounter).transacting(tx));
        } else {
          allPromises.push(knex('user_game_season_counters').insert(seasonCounter).transacting(tx));
        }

        this.counter = counter;
        this.factionCounter = factionCounter;
        this.generalCounter = generalCounter;
        this.seasonCounter = seasonCounter;

        return Promise.all(allPromises);
      })
      .timeout(10000)
      .catch(Promise.TimeoutError, (e) => {
        Logger.module('UsersModule').error(`updateGameCounters() -> ERROR, operation timeout for u:${userId}`);
        throw e;
      })).bind(this_obj)
      .then(function () {
        Logger.module('UsersModule').debug(`updateGameCounters() -> updated ${gameType} game counters for ${userId.blue}`);
        return {
          counter: this.counter,
          faction_counter: this.factionCounter,
          general_counter: this.generalCounter,
          season_counter: this.seasonCounter,
        };
      });
  }

  /**
	 * Update user's stats given a game.
	 * @public
	 * @param	{String}	userId		User ID for which to process quests.
	 * @param	{String}	gameId		Game ID for which to calculate stat changes
	 * @param	{String}	gameType	Game type (see SDK.GameType)
	 * @param	{String}	gameData	Plain object with game data
	 * @return	{Promise}				Promise that will post STATDATA on completion.
	 */
  static updateUserStatsWithGame(userId, gameId, gameType, gameData, systemTime) {
    // userId must be defined
    if (!userId || !gameId) {
      return Promise.reject(new Error(`Can not update user-stats : invalid user ID - ${userId} - or game ID - ${gameId}`));
    }

    const MOMENT_NOW_UTC = systemTime || moment().utc();

    // Begin the promise rabbit hole
    return DuelystFirebase.connect().getRootRef()
      .bind({})
      .then(function (fbRootRef) {
        this.fbRootRef = fbRootRef;
        const statsRef = this.fbRootRef.child('user-stats').child(userId);

        return new Promise((resolve, reject) => statsRef.once('value', (statsSnapshot) => resolve(statsSnapshot.val())));
      })
      .then(function (statsData) {
        let statsRef;
        try {
          const playerData = UtilsGameSession.getPlayerDataForId(gameData, userId);
          const playerSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameData, userId);
          const {
            isWinner,
          } = playerData;
          statsRef = this.fbRootRef.child('user-stats').child(userId);

          if (!statsData) {
            statsData = {};
          }

          // TODO: Temp until we have queue type defined in an architecture
          const queueName = gameType;

          if (!statsData[queueName]) {
            statsData[queueName] = {};
          }
          const queueStatsData = statsData[queueName];

          // -- First per queue stats
          // Update player's global win streak
          if (queueStatsData.winStreak == null) { queueStatsData.winStreak = 0; }
          if (gameType !== GameType.Casual) {
            if (isWinner) {
              queueStatsData.winStreak += 1;
            } else {
              queueStatsData.winStreak = 0;
            }
          }

          // -- Then per faction data
          const {
            factionId,
          } = playerSetupData;
          if (!queueStatsData[factionId]) {
            queueStatsData[factionId] = {};
          }
          const factionStatsData = queueStatsData[factionId];
          factionStatsData.factionId = factionId;

          // Update per faction win count and play count
          factionStatsData.playCount = (factionStatsData.playCount || 0) + 1;
          if (isWinner) {
            factionStatsData.winCount = (factionStatsData.winCount || 0) + 1;
          }

          // Update cards played counts
          if (!factionStatsData.cardsPlayedCounts) {
            factionStatsData.cardsPlayedCounts = {};
          }

          const cardIndices = Object.keys(gameData.cardsByIndex);
          for (const cardIndex of Array.from(cardIndices)) {
            const card = gameData.cardsByIndex[cardIndex];
            if (card.ownerId === userId) {
              factionStatsData.cardsPlayedCounts[card.id] = (factionStatsData.cardsPlayedCounts[card.id] || 0) + 1;
            }
          }

          // Update discarded card counts
          if (!factionStatsData.cardsDiscardedCounts) {
            factionStatsData.cardsDiscardedCounts = {};
          }

          // Update total turns played (this represents turns played by opponents as well)
          let totalTurns = 1; // for currentTurn
          if (gameData.turns) {
            totalTurns += gameData.turns.length;
          }
          factionStatsData.totalTurnsPlayed = (factionStatsData.totalTurnsPlayed || 0) + totalTurns;

          // Update play total stats
          factionStatsData.totalDamageDealt = (factionStatsData.totalDamageDealt || 0) + playerData.totalDamageDealt;
          factionStatsData.totalDamageDealtToGeneral = (factionStatsData.totalDamageDealtToGeneral || 0) + playerData.totalDamageDealtToGeneral;
          factionStatsData.totalMinionsKilled = (factionStatsData.totalMinionsKilled || 0) + playerData.totalMinionsKilled;
          factionStatsData.totalMinionsPlayedFromHand = (factionStatsData.totalMinionsPlayedFromHand || 0) + playerData.totalMinionsPlayedFromHand;
          factionStatsData.totalMinionsSpawned = (factionStatsData.totalMinionsSpawned || 0) + playerData.totalMinionsSpawned;
          factionStatsData.totalSpellsCast = (factionStatsData.totalSpellsCast || 0) + playerData.totalSpellsCast;
          factionStatsData.totalSpellsPlayedFromHand = (factionStatsData.totalSpellsPlayedFromHand || 0) + playerData.totalSpellsPlayedFromHand;
        } catch (e) {
          Logger.module('UsersModule').debug(`updateUserStatsWithGame() -> caught ERROR processing stats data for user ${userId}: ${e.message}`.red);
          throw new Error('ERROR PROCESSING STATS DATA');
        }

        // Perform firebase transaction to update stats
        return new Promise((resolve, reject) => {
          Logger.module('UsersModule').debug(`updateUserStatsWithGame() -> UPDATING stats for user ${userId}`);

          // function to update quest list
          const onUpdateUserStatsTransaction = function (userStatsTransactionData) {
            // Don't care what the previous stats were, replace them with the updated version
            userStatsTransactionData = statsData;
            userStatsTransactionData.updated_at = MOMENT_NOW_UTC.valueOf();

            return userStatsTransactionData;
          };

          // function to call when the quest update is complete
          const onUpdateUserStatsTransactionComplete = function (error, committed, snapshot) {
            if (error) {
              return reject(error);
            } if (committed) {
              Logger.module('UsersModule').debug(`updateUserStatsWithGame() -> updated user-stats committed for ${userId.blue}`);
              return resolve(snapshot.val());
            }
            return reject(new Errors.FirebaseTransactionDidNotCommitError(`User Stats for ${userId.blue} did NOT COMMIT`));
          };

          // update users stats
          return statsRef.transaction(onUpdateUserStatsTransaction, onUpdateUserStatsTransactionComplete);
        });
      });
  }

  /**
	 * Completes a challenge for a user and unlocks any rewards !if! it's not already completed
	 * @public
	 * @param	{String}	userId					User ID.
	 * @param	{String}	challenge_type			type of challenge completed
	 * @param	{Boolean}	shouldProcessQuests		should we attempt to process quests as a result of this challenge completion (since beginner quests include a challenge quest)
	 * @return	{Promise}	Promise that will resolve and give rewards if challenge hasn't been completed before, will resolve false and not give rewards if it has
	 */
  static completeChallengeWithType(userId, challengeType, shouldProcessQuests) {
    // TODO: Error check, if the challenge type isn't recognized we shouldn't record it etc

    const MOMENT_NOW_UTC = moment().utc();
    const this_obj = {};

    Logger.module('UsersModule').time(`completeChallengeWithType() -> user ${userId.blue} completed challenge type ${challengeType}.`);

    return knex('user_challenges').where({ user_id: userId, challenge_id: challengeType }).first()
      .bind(this_obj)
      .then((challengeRow) => {
        if (challengeRow && challengeRow.completed_at) {
          Logger.module('UsersModule').debug(`completeChallengeWithType() -> user ${userId.blue} has already completed challenge type ${challengeType}.`);
          return Promise.resolve(false);
        }
        var txPromise = knex.transaction((tx) => {
          // lock user record while updating data
          knex('users').where({ id: userId }).first('id').forUpdate()
            .transacting(tx)
            .bind(this_obj)
            .then(function () {
              // give the user their rewards
              let rewardData;
              const goldReward = SDK.ChallengeFactory.getGoldRewardedForChallengeType(challengeType);
              const cardRewards = SDK.ChallengeFactory.getCardIdsRewardedForChallengeType(challengeType);
              const spiritReward = SDK.ChallengeFactory.getSpiritRewardedForChallengeType(challengeType);
              const boosterPackRewards = SDK.ChallengeFactory.getBoosterPacksRewardedForChallengeType(challengeType);
              const factionUnlockedReward = SDK.ChallengeFactory.getFactionUnlockedRewardedForChallengeType(challengeType);

              this.rewards = [];
              this.challengeRow = {
                user_id: userId,
                challenge_id: challengeType,
                completed_at: MOMENT_NOW_UTC.toDate(),
                last_attempted_at: (challengeRow != null ? challengeRow.last_attempted_at : undefined) || MOMENT_NOW_UTC.toDate(),
                reward_ids: [],
                is_unread: true,
              };

              const rewardPromises = [];

              if (goldReward) {
                // set up reward data
                rewardData = {
                  id: generatePushId(),
                  user_id: userId,
                  reward_category: 'challenge',
                  reward_type: challengeType,
                  gold: goldReward,
                  created_at: MOMENT_NOW_UTC.toDate(),
                  is_unread: true,
                };

                // add it to the rewards array
                this.rewards.push(rewardData);

                // add the promise to our list of reward promises
                rewardPromises.push(knex('user_rewards').insert(rewardData).transacting(tx));
                rewardPromises.push(InventoryModule.giveUserGold(txPromise, tx, userId, goldReward, 'challenge', challengeType));
              }

              if (cardRewards) {
                // set up reward data
                rewardData = {
                  id: generatePushId(),
                  user_id: userId,
                  reward_category: 'challenge',
                  reward_type: challengeType,
                  cards: cardRewards,
                  created_at: MOMENT_NOW_UTC.toDate(),
                  is_unread: true,
                };

                // add it to the rewards array
                this.rewards.push(rewardData);

                // add the promise to our list of reward promises
                rewardPromises.push(knex('user_rewards').insert(rewardData).transacting(tx));
                rewardPromises.push(InventoryModule.giveUserCards(txPromise, tx, userId, cardRewards, 'challenge'));
              }

              if (spiritReward) {
                // set up reward data
                rewardData = {
                  id: generatePushId(),
                  user_id: userId,
                  reward_category: 'challenge',
                  reward_type: challengeType,
                  spirit: spiritReward,
                  created_at: MOMENT_NOW_UTC.toDate(),
                  is_unread: true,
                };

                // add it to the rewards array
                this.rewards.push(rewardData);

                // add the promise to our list of reward promises
                rewardPromises.push(knex('user_rewards').insert(rewardData).transacting(tx));
                rewardPromises.push(InventoryModule.giveUserSpirit(txPromise, tx, userId, spiritReward, 'challenge'));
              }

              if (boosterPackRewards) {
                // set up reward data
                rewardData = {
                  id: generatePushId(),
                  user_id: userId,
                  reward_category: 'challenge',
                  reward_type: challengeType,
                  spirit_orbs: boosterPackRewards.length,
                  created_at: MOMENT_NOW_UTC.toDate(),
                  is_unread: true,
                };

                // add it to the rewards array
                this.rewards.push(rewardData);

                // add the promise to our list of reward promises
                rewardPromises.push(knex('user_rewards').insert(rewardData).transacting(tx));

                _.each(boosterPackRewards, (boosterPackData) => // Bound to array of reward promises
                  rewardPromises.push(
                    InventoryModule.addBoosterPackToUser(txPromise, tx, userId, 1, 'soft', boosterPackData),
                  ));
              }

              if (factionUnlockedReward) {
                // set up reward data
                rewardData = {
                  id: generatePushId(),
                  user_id: userId,
                  reward_category: 'challenge',
                  reward_type: challengeType,
                  unlocked_faction_id: factionUnlockedReward,
                  created_at: MOMENT_NOW_UTC.toDate(),
                  is_unread: true,
                };

                // add it to the rewards array
                this.rewards.push(rewardData);

                // add the promise to our list of reward promises
                rewardPromises.push(knex('user_rewards').insert(rewardData).transacting(tx));
              }

              this.challengeRow.reward_ids = _.map(this.rewards, (r) => r.id);

              if (challengeRow) {
                rewardPromises.push(knex('user_challenges').where({ user_id: userId, challenge_id: challengeType }).update(this.challengeRow).transacting(tx));
              } else {
                rewardPromises.push(knex('user_challenges').insert(this.challengeRow).transacting(tx));
              }

              return Promise.all(rewardPromises);
            })
            .then(function () {
              if (this.challengeRow && shouldProcessQuests) {
                return QuestsModule.updateQuestProgressWithCompletedChallenge(txPromise, tx, userId, challengeType, MOMENT_NOW_UTC);
              }
              return Promise.resolve();
            })
            .then(function (questProgressResponse) {
              if (this.challengeRow && (__guard__(questProgressResponse != null ? questProgressResponse.rewards : undefined, (x) => x.length) > 0)) {
                Logger.module('UsersModule').debug(`completeChallengeWithType() -> user ${userId.blue} completed challenge quest rewards count: ${(questProgressResponse != null ? questProgressResponse.rewards.length : undefined)}`);

                for (const reward of Array.from(questProgressResponse.rewards)) {
                  this.rewards.push(reward);
                  this.challengeRow.reward_ids.push(reward.id);
                }

                return knex('user_challenges').where({ user_id: userId, challenge_id: challengeType }).update({
                  reward_ids: this.challengeRow.reward_ids,
                }).transacting(tx);
              }
            })
            .then(function () {
              return Promise.all([
                DuelystFirebase.connect().getRootRef(),
                this.challengeRow,
                this.rewards,
              ]);
            })
            .spread(function (rootRef, challengeRow, rewards) {
              const allPromises = [];

              if (challengeRow != null) {
                delete challengeRow.user_id;
                // delete challengeRow.challenge_id

                if (challengeRow.last_attempted_at) { challengeRow.last_attempted_at = moment.utc(challengeRow.last_attempted_at).valueOf(); }
                if (challengeRow.completed_at) { challengeRow.completed_at = moment.utc(challengeRow.completed_at).valueOf(); }

                allPromises.push(FirebasePromises.set(rootRef.child('user-challenge-progression').child(userId).child(challengeType), challengeRow));

                this.challengeRow = challengeRow;
              }

              // if rewards?
              // 	for reward in rewards
              // 		reward_id = reward.id
              // 		delete reward.id
              // 		delete reward.user_id
              // 		reward.created_at = moment.utc(reward.created_at).valueOf()

              // 		allPromises.push FirebasePromises.set(rootRef.child("user-rewards").child(userId).child(reward_id),reward)

              return Promise.all(allPromises);
            })
            .then(() => SyncModule._bumpUserTransactionCounter(tx, userId))
            .then(tx.commit)
            .catch(tx.rollback);
        }).bind(this_obj);

        return txPromise;
      })
      .then(function () {
        Logger.module('UsersModule').timeEnd(`completeChallengeWithType() -> user ${userId.blue} completed challenge type ${challengeType}.`);

        let responseData = null;

        if (this.challengeRow) {
          responseData = { challenge: this.challengeRow };
        }

        if (this.rewards) {
          responseData.rewards = this.rewards;
        }

        return responseData;
      });
  }

  /**
	 * Marks a challenge as attempted.
	 * @public
	 * @param	{String}	userId				User ID.
	 * @param	{String}	challenge_type		type of challenge
	 * @return	{Promise}						Promise that will resolve on completion
	 */
  static markChallengeAsAttempted(userId, challengeType) {
    // TODO: Error check, if the challenge type isn't recognized we shouldn't record it etc

    const MOMENT_NOW_UTC = moment().utc();
    const this_obj = {};

    Logger.module('UsersModule').time(`markChallengeAsAttempted() -> user ${userId.blue} attempted challenge type ${challengeType}.`);

    const txPromise = knex.transaction((tx) => {
      // lock user and challenge row
      Promise.all([
        knex('user_challenges').where({ user_id: userId, challenge_id: challengeType }).first().forUpdate()
          .transacting(tx),
        knex('users').where({ id: userId }).first('id').forUpdate()
          .transacting(tx),
      ])
        .bind(this_obj)
        .spread(function (challengeRow) {
          this.challengeRow = challengeRow;

          if (this.challengeRow != null) {
            this.challengeRow.last_attempted_at = MOMENT_NOW_UTC.toDate();
            return knex('user_challenges').where({ user_id: userId, challenge_id: challengeType }).update(this.challengeRow).transacting(tx);
          }
          this.challengeRow = {
            user_id: userId,
            challenge_id: challengeType,
            last_attempted_at: MOMENT_NOW_UTC.toDate(),
          };
          return knex('user_challenges').insert(this.challengeRow).transacting(tx);
        }).then(() => DuelystFirebase.connect().getRootRef())
        .then(function (rootRef) {
          const allPromises = [];

          if (this.challengeRow != null) {
            delete this.challengeRow.user_id;
            // delete @.challengeRow.challenge_id

            if (this.challengeRow.last_attempted_at) { this.challengeRow.last_attempted_at = moment.utc(this.challengeRow.last_attempted_at).valueOf(); }
            if (this.challengeRow.completed_at) { this.challengeRow.completed_at = moment.utc(this.challengeRow.completed_at).valueOf(); }

            allPromises.push(FirebasePromises.set(rootRef.child('user-challenge-progression').child(userId).child(challengeType), this.challengeRow));
          }

          return Promise.all(allPromises);
        })
        .then(() => SyncModule._bumpUserTransactionCounter(tx, userId))
        .then(tx.commit)
        .catch(tx.rollback);
    }).bind(this_obj)
      .then(function () {
        const responseData = { challenge: this.challengeRow };
        return responseData;
      });

    return txPromise;
  }

  /**
	 * Iterate core new player progression up by one point if all requirements met, or generate missing quests if any required quests are missing from current/complete quest list for this user.
	 * @public
	 * @param	{String}	userId						User ID.
	 * @return	{Promise}	Promise that will resolve when complete with the module progression data
	 */
  static iterateNewPlayerCoreProgression(userId) {
    return knex('user_new_player_progression').where('user_id', userId).andWhere('module_name', NewPlayerProgressionModuleLookup.Core).first()
      .bind({})
      .then(function (moduleProgression) {
        const stage = NewPlayerProgressionStageEnum[moduleProgression != null ? moduleProgression.stage : undefined] || NewPlayerProgressionStageEnum.Tutorial;

        // if we're at the final stage, just return
        if (stage.value >= NewPlayerProgressionHelper.FinalStage.value) {
          return Promise.resolve();
        }

        return Promise.all([
          knex('user_quests').where('user_id', userId).select(),
          knex('user_quests_complete').where('user_id', userId).select(),
        ])
          .bind(this)
          .spread((quests, questsComplete) => {
            let beginnerQuests = NewPlayerProgressionHelper.questsForStage(stage);
            // exclude non-required beginner quests for this tage
            beginnerQuests = _.filter(beginnerQuests, (q) => q.isRequired);

            // if we have active quests, check that none are beginner for current stage
            if ((quests != null ? quests.length : undefined) > 0) {
              // let's see if any beginner quests for this stage are still in progress
              const beginnerQuestInProgress = _.find(quests, (q) => _.find(beginnerQuests, (bq) => bq.id === q.quest_type_id));
              // if any beginner quests for this stage are still in progress, DO NOTHING
              if (beginnerQuestInProgress) {
                return Promise.resolve();
              }
            }

            // let's see if all beginner quests for this stage are completed
            const beginnerQuestsComplete = _.filter(questsComplete, (q) => _.find(beginnerQuests, (bq) => bq.id === q.quest_type_id));
            // if any beginner quests for this stage have NOT been completed, we have a problem... looks like we need to generate these quests
            if ((beginnerQuestsComplete != null ? beginnerQuestsComplete.length : undefined) < beginnerQuests.length) {
              // throw new Error("Invalid state: user never received all required stage quests")
              Logger.module('SDK').warn(`iterateNewPlayerCoreProgression() -> Invalid state: user ${userId.blue} never received all required stage ${stage.key} quests`);
              return QuestsModule.generateBeginnerQuests(userId)
                .bind({})
                .then(function (questData) {
                  if (questData) {
                    return this.questData = questData;
                  }
                }).catch(Errors.NoNeedForNewBeginnerQuestsError, (e) => Logger.module('SDK').debug(`iterateNewPlayerCoreProgression() -> no need for new quests at ${nextStage.key} for ${userId.blue}`))
                .then(function () {
                  this.progressionData = moduleProgression;
                  return this;
                });
            }

            // if we're here, it means all required beginner quests have been completed up to here...
            // so let's push the core stage forward

            // calculate the next linear stage point for core progression
            var nextStage = null;
            for (const s of Array.from(NewPlayerProgressionStageEnum.enums)) {
              if (s.value > stage.value) {
                Logger.module('SDK').debug(`iterateNewPlayerCoreProgression() -> from stage ${stage.key} to next stage ${s.key} for ${userId.blue}`);
                nextStage = s;
                break;
              }
            }

            // update current stage and generate any new beginner quests
            return UsersModule.setNewPlayerFeatureProgression(userId, NewPlayerProgressionModuleLookup.Core, nextStage.key)
              .bind({})
              .then(function (progressionData) {
                this.progressionData = progressionData;
                return QuestsModule.generateBeginnerQuests(userId);
              }).then(function (questData) {
                if (questData) {
                  return this.questData = questData;
                }
              })
              .catch(Errors.NoNeedForNewBeginnerQuestsError, (e) => Logger.module('SDK').debug(`iterateNewPlayerCoreProgression() -> no need for new quests at ${nextStage.key} for ${userId.blue}`))
              .then(function () {
                return this;
              });
          }).then((responseData) => responseData);
      });
  }

  /**
	 * Sets user feature progression for a module
	 * @public
	 * @param	{String}	userId						User ID.
	 * @param	{String}	moduleName					Arbitrary name of a module
	 * @param	{String}	stage						Arbitrary key for a progression item
	 * @return	{Promise}	Promise that will resolve when complete with the module progression data
	 */
  static setNewPlayerFeatureProgression(userId, moduleName, stage) {
    // TODO: Error check, if the challenge type isn't recognized we shouldn't record it etc

    const MOMENT_NOW_UTC = moment().utc();
    const this_obj = {};

    Logger.module('UsersModule').time(`setNewPlayerFeatureProgression() -> user ${userId.blue} marking module ${moduleName} as ${stage}.`);

    if ((moduleName === NewPlayerProgressionModuleLookup.Core) && (NewPlayerProgressionStageEnum[stage] == null)) {
      return Promise.reject(new Errors.BadRequestError('Invalid core new player stage'));
    }

    const txPromise = knex.transaction((tx) => {
      tx('user_new_player_progression').where({ user_id: userId, module_name: moduleName }).first().forUpdate()
        .bind(this_obj)
        .then(function (progressionRow) {
          // core stage has some special rules
          if (moduleName === NewPlayerProgressionModuleLookup.Core) {
            const currentStage = (progressionRow != null ? progressionRow.stage : undefined) || NewPlayerProgressionStageEnum.Tutorial;
            if (NewPlayerProgressionStageEnum[stage].value < currentStage.value) {
              throw new Errors.BadRequestError('Can not roll back to a previous core new player stage');
            }
          }

          this.progressionRow = progressionRow;
          let queryPromise = null;
          if (progressionRow && (progressionRow.stage === stage)) {
            Logger.module('UsersModule').error(`setNewPlayerFeatureProgression() -> ERROR: requested same stage: ${stage}.`);
            throw new Errors.BadRequestError('New player progression stage already at the requested stage');
          } else if (progressionRow) {
				 	// TODO: this never gets called, here 2 gets called twice for tutorial -> tutorialdone
            this.progressionRow.stage = stage;
            this.progressionRow.updated_at = MOMENT_NOW_UTC.toDate();
            queryPromise = tx('user_new_player_progression').where({ user_id: userId, module_name: moduleName }).update({
              stage:	this.progressionRow.stage,
              updated_at:	this.progressionRow.updated_at,
            });
          } else {
            this.progressionRow = {
              user_id: userId,
              module_name: moduleName,
              stage,
            };
            queryPromise = tx('user_new_player_progression').insert(this.progressionRow);
          }

          return queryPromise;
        })
        .then((updateCount) => {
          if (updateCount) {
            return SyncModule._bumpUserTransactionCounter(tx, userId);
          }
        })
        .then(tx.commit)
        .catch(tx.rollback);
    }).bind(this_obj)
      .then(function () {
        Logger.module('UsersModule').timeEnd(`setNewPlayerFeatureProgression() -> user ${userId.blue} marking module ${moduleName} as ${stage}.`);

        return this.progressionRow;
      });

    return txPromise;
  }

  /**
	 * Set a new portrait for a user
	 * @public
	 * @param	{String}	userId						User ID.
	 * @param	{String}	portraitId					Portrait ID
	 * @return	{Promise}	Promise that will resolve when complete with the module progression data
	 */
  static setPortraitId(userId, portraitId) {
    // userId must be defined
    let txPromise;
    if ((userId == null)) {
      return Promise.reject(new Errors.NotFoundError(`Can not setPortraitId(): invalid user ID - ${userId}`));
    }

    const MOMENT_NOW_UTC = moment().utc();
    const this_obj = {};

    Logger.module('UsersModule').time(`setPortraitId() -> user ${userId.blue}.`);

    return txPromise = knex.transaction((tx) => {
      InventoryModule.isAllowedToUseCosmetic(txPromise, tx, userId, portraitId)
        .bind(this_obj)
        .then(() => knex('users').where({ id: userId }).update({
          portrait_id: portraitId,
        })).then((updateCount) => {
          if (updateCount === 0) {
            throw new Errors.NotFoundError(`User with id ${userId} not found`);
          }
        })
        .then(() => DuelystFirebase.connect().getRootRef())
        .then((rootRef) => FirebasePromises.set(rootRef.child('users').child(userId).child('presence').child('portrait_id'), portraitId))
        .then(() => SyncModule._bumpUserTransactionCounter(tx, userId))
        .then(tx.commit)
        .catch(tx.rollback);
    }).bind(this_obj)
      .then(() => {
        Logger.module('UsersModule').timeEnd(`setPortraitId() -> user ${userId.blue}.`);
        return portraitId;
      });
  }

  /**
	 * Set a the preferred Battle Map for a user
	 * @public
	 * @param	{String}	userId						User ID.
	 * @param	{String}	battleMapId					Battle Map ID
	 * @return	{Promise}	Promise that will resolve when complete
	 */
  static setBattleMapId(userId, battleMapId) {
    // userId must be defined
    let txPromise;
    if ((userId == null)) {
      return Promise.reject(new Errors.NotFoundError(`Can not setPortraitId(): invalid user ID - ${userId}`));
    }

    const MOMENT_NOW_UTC = moment().utc();
    const this_obj = {};

    Logger.module('UsersModule').time(`setBattleMapId() -> user ${userId.blue}.`);

    return txPromise = knex.transaction((tx) => {
      const checkForInventoryPromise = battleMapId !== null ? InventoryModule.isAllowedToUseCosmetic(txPromise, tx, userId, battleMapId) : Promise.resolve(true);

      checkForInventoryPromise
        .bind(this_obj)
        .then(() => tx('users').where({ id: userId }).update({
          battle_map_id: battleMapId,
        })).then((updateCount) => {
          if (updateCount === 0) {
            throw new Errors.NotFoundError(`User with id ${userId} not found`);
          }
        }).then(() => DuelystFirebase.connect().getRootRef())
        .then((rootRef) => FirebasePromises.set(rootRef.child('users').child(userId).child('battle_map_id'), battleMapId))
        .then(() => SyncModule._bumpUserTransactionCounter(tx, userId))
        .then(tx.commit)
        .catch(tx.rollback);
    }).bind(this_obj)
      .then(() => {
        Logger.module('UsersModule').timeEnd(`setBattleMapId() -> user ${userId.blue}.`);
        return battleMapId;
      });
  }

  /**
	 * Add a small in-game notification for a user
	 * @public
	 * @param	{String}	userId			User ID.
	 * @param	{String}	message			What message to show
	 * @param	{String}	type			Message type
	 * @return	{Promise}					Promise that will resolve when complete
	 */
  static inGameNotify(userId, message, type = null) {
    // TODO: Error check, if the challenge type isn't recognized we shouldn't record it etc

    const MOMENT_NOW_UTC = moment().utc();
    const this_obj = {};

    return Promise.resolve()
      .bind({})
      .then(() => DuelystFirebase.connect().getRootRef())
      .then((rootRef) => FirebasePromises.push(rootRef.child('user-notifications').child(userId), { message, created_at: moment().utc().valueOf(), type }));
  }

  static ___hardWipeUserData(userId) {
    Logger.module('UsersModule').time(`___hardWipeUserData() -> WARNING: hard wiping ${userId.blue}`.red);

    return DuelystFirebase.connect().getRootRef()
      .then((fbRootRef) => Promise.all([
        FirebasePromises.remove(fbRootRef.child('user-aggregates').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-arena-run').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-challenge-progression').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-decks').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-faction-progression').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-games').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-games').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-game-job-status').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-inventory').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-logs').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-matchmaking-errors').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-news').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-progression').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-quests').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-ranking').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-rewards').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-stats').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-transactions').child(userId)),
        FirebasePromises.remove(fbRootRef.child('user-achievements').child(userId)),

        knex('user_cards').where('user_id', userId).delete(),
        knex('user_card_collection').where('user_id', userId).delete(),
        knex('user_card_log').where('user_id', userId).delete(),
        knex('user_challenges').where('user_id', userId).delete(),
        knex('user_charges').where('user_id', userId).delete(),
        knex('user_currency_log').where('user_id', userId).delete(),
        knex('user_decks').where('user_id', userId).delete(),
        knex('user_faction_progression').where('user_id', userId).delete(),
        knex('user_faction_progression_events').where('user_id', userId).delete(),
        knex('user_games').where('user_id', userId).delete(),
        knex('user_gauntlet_run').where('user_id', userId).delete(),
        knex('user_gauntlet_run_complete').where('user_id', userId).delete(),
        knex('user_gauntlet_tickets').where('user_id', userId).delete(),
        knex('user_gauntlet_tickets_used').where('user_id', userId).delete(),
        knex('user_progression').where('user_id', userId).delete(),
        knex('user_progression_days').where('user_id', userId).delete(),
        knex('user_quests').where('user_id', userId).delete(),
        knex('user_quests_complete').where('user_id', userId).delete(),
        knex('user_rank_events').where('user_id', userId).delete(),
        knex('user_rank_history').where('user_id', userId).delete(),
        knex('user_rewards').where('user_id', userId).delete(),
        knex('user_spirit_orbs').where('user_id', userId).delete(),
        knex('user_spirit_orbs_opened').where('user_id', userId).delete(),
        knex('user_codex_inventory').where('user_id', userId).delete(),
        knex('user_new_player_progression').where('user_id', userId).delete(),
        knex('user_achievements').where('user_id', userId).delete(),
        knex('users').where('id', userId).update({
          ltv: 0,
          rank: 30,
          rank_created_at: null,
          rank_starting_at: null,
          rank_stars: 0,
          rank_stars_required: 1,
          rank_updated_at: null,
          rank_win_streak: 0,
          rank_top_rank: null,
          rank_is_unread: false,
          top_rank: null,
          top_rank_starting_at: null,
          top_rank_updated_at: null,
          wallet_gold: 0,
          wallet_spirit: 0,
          wallet_cores: 0,
          wallet_updated_at: null,
          total_gold_earned: 0,
          total_spirit_earned: 0,
          daily_quests_generated_at: null,
          daily_quests_updated_at: null,
        }),
      ])).then(() => Logger.module('UsersModule').timeEnd(`___hardWipeUserData() -> WARNING: hard wiping ${userId.blue}`.red));
  }

  /**
	 * Sets user feature progression for a module
	 * @public
	 * @param	{String}	userId						User ID.
	 * @return	{Promise}	Promise that will resolve when complete
	 */
  static ___snapshotUserData(userId) {
    Logger.module('UsersModule').time(`___snapshotUserData() -> retrieving data for user ID ${userId.blue}`.green);

    // List of the columns we want to grab from the users table, is everything except password
    const userTableColumns = ['id', 'created_at', 'updated_at', 'last_session_at', 'session_count', 'username_updated_at',
      'email_verified_at', 'password_updated_at', 'invite_code', 'ltv', 'purchase_count', 'last_purchase_at', 'rank',
      'rank_created_at', 'rank_starting_at', 'rank_stars', 'rank_stars_required', 'rank_delta', 'rank_top_rank',
      'rank_updated_at', 'rank_win_streak', 'rank_is_unread', 'top_rank', 'top_rank_starting_at', 'top_rank_updated_at',
      'daily_quests_generated_at', 'daily_quests_updated_at', 'achievements_last_read_at', 'wallet_gold',
      'wallet_spirit', 'wallet_cores', 'wallet_updated_at', 'total_gold_earned', 'total_spirit_earned', 'buddy_count',
      'tx_count', 'synced_firebase_at', 'stripe_customer_id', 'card_last_four_digits', 'card_updated_at',
      'top_gauntlet_win_count', 'portrait_id', 'total_gold_tips_given', 'referral_code', 'is_suspended', 'suspended_at',
      'suspended_memo', 'top_rank_ladder_position', 'top_rank_rating', 'is_bot'];

    return DuelystFirebase.connect().getRootRef()
      .then((fbRootRef) => Promise.all([
        FirebasePromises.once(fbRootRef.child('user-aggregates').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-arena-run').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-challenge-progression').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-decks').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-faction-progression').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-games').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-game-job-status').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-inventory').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-logs').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-matchmaking-errors').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-news').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-progression').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-quests').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-ranking').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-rewards').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-stats').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-transactions').child(userId), 'value'),
        FirebasePromises.once(fbRootRef.child('user-achievements').child(userId), 'value'),

        knex('user_cards').where('user_id', userId).select(),
        knex('user_card_collection').where('user_id', userId).select(),
        knex('user_card_log').where('user_id', userId).select(),
        knex('user_challenges').where('user_id', userId).select(),
        knex('user_charges').where('user_id', userId).select(),
        knex('user_currency_log').where('user_id', userId).select(),
        knex('user_decks').where('user_id', userId).select(),
        knex('user_faction_progression').where('user_id', userId).select(),
        knex('user_faction_progression_events').where('user_id', userId).select(),
        knex('user_games').where('user_id', userId).select(),
        knex('user_gauntlet_run').where('user_id', userId).select(),
        knex('user_gauntlet_run_complete').where('user_id', userId).select(),
        knex('user_gauntlet_tickets').where('user_id', userId).select(),
        knex('user_gauntlet_tickets_used').where('user_id', userId).select(),
        knex('user_progression').where('user_id', userId).select(),
        knex('user_progression_days').where('user_id', userId).select(),
        knex('user_quests').where('user_id', userId).select(),
        knex('user_quests_complete').where('user_id', userId).select(),
        knex('user_rank_events').where('user_id', userId).select(),
        knex('user_rank_history').where('user_id', userId).select(),
        knex('user_rewards').where('user_id', userId).select(),
        knex('user_spirit_orbs').where('user_id', userId).select(),
        knex('user_spirit_orbs_opened').where('user_id', userId).select(),
        knex('user_codex_inventory').where('user_id', userId).select(),
        knex('user_new_player_progression').where('user_id', userId).select(),
        knex('user_achievements').where('user_id', userId).select(),
        knex('user_cosmetic_chests').where('user_id', userId).select(),
        knex('user_cosmetic_chests_opened').where('user_id', userId).select(),
        knex('user_cosmetic_chest_keys').where('user_id', userId).select(),
        knex('user_cosmetic_chest_keys_used').where('user_id', userId).select(),
        knex('users').where('id', userId).first(userTableColumns),
      ])).spread((
        fbUserAggregates,
        fbUserArenaRun,
        fbUserChallengeProgression,
        fbUserDecks,
        fbUserFactionProgression,
        fbUserGames,
        fbUserGameJobStatus,
        fbUserInventory,
        fbUserLogs,
        fbUserMatchmakingErrors,
        fbUserNews,
        fbUserProgression,
        fbUserQuests,
        fbUserRanking,
        fbUserRewards,
        fbUserStats,
        fbUserTransactions,
        fbUserAchievements,
        sqlUserCards,
        sqlUserCardCollection,
        sqlUserCardLog,
        sqlUserChallenges,
        sqlUserCharges,
        sqlUserCurrencyLog,
        sqlUserDecks,
        sqlUserFactionProgression,
        sqlUserFactionProgressionEvents,
        sqlUserGames,
        sqlUserGauntletRun,
        sqlUserGauntletRunComplete,
        sqlUserGauntletTickets,
        sqlUserGauntletTicketsUsed,
        sqlUserProgression,
        sqlUserProgressionDays,
        sqlUserQuests,
        sqlUserQuestsComplete,
        sqlUserRankEvents,
        sqlUserRankHistory,
        sqlUserRewards,
        sqlUserSpiritOrbs,
        sqlUserSpiritOrbsOpened,
        sqlUserCodexInventory,
        sqlUserNewPlayerProgression,
        sqlUserAchievements,
        sqlUserChestRows,
        sqlUserChestOpenedRows,
        sqlUserChestKeyRows,
        sqlUserChestKeyUsedRows,
        sqlUserRow,
      ) => {
        const userSnapshot = {
          firebase: {},
          sql: {},
        };

        userSnapshot.firebase.fbUserAggregates = fbUserAggregates != null ? fbUserAggregates.val() : undefined;
        userSnapshot.firebase.fbUserArenaRun = fbUserArenaRun != null ? fbUserArenaRun.val() : undefined;
        userSnapshot.firebase.fbUserChallengeProgression = fbUserChallengeProgression != null ? fbUserChallengeProgression.val() : undefined;
        userSnapshot.firebase.fbUserDecks = fbUserDecks != null ? fbUserDecks.val() : undefined;
        userSnapshot.firebase.fbUserFactionProgression = fbUserFactionProgression != null ? fbUserFactionProgression.val() : undefined;
        userSnapshot.firebase.fbUserGames = fbUserGames != null ? fbUserGames.val() : undefined;
        userSnapshot.firebase.fbUserGameJobStatus = fbUserGameJobStatus != null ? fbUserGameJobStatus.val() : undefined;
        userSnapshot.firebase.fbUserInventory = fbUserInventory != null ? fbUserInventory.val() : undefined;
        userSnapshot.firebase.fbUserLogs = fbUserLogs != null ? fbUserLogs.val() : undefined;

        userSnapshot.firebase.fbUserMatchmakingErrors = fbUserMatchmakingErrors != null ? fbUserMatchmakingErrors.val() : undefined;
        userSnapshot.firebase.fbUserNews = fbUserNews != null ? fbUserNews.val() : undefined;
        userSnapshot.firebase.fbUserProgression = fbUserProgression != null ? fbUserProgression.val() : undefined;
        userSnapshot.firebase.fbUserQuests = fbUserQuests != null ? fbUserQuests.val() : undefined;
        userSnapshot.firebase.fbUserRanking = fbUserRanking != null ? fbUserRanking.val() : undefined;
        userSnapshot.firebase.fbUserRewards = fbUserRewards != null ? fbUserRewards.val() : undefined;
        userSnapshot.firebase.fbUserStats = fbUserStats != null ? fbUserStats.val() : undefined;
        userSnapshot.firebase.fbUserTransactions = fbUserTransactions != null ? fbUserTransactions.val() : undefined;
        userSnapshot.firebase.fbUserAchievements = fbUserAchievements != null ? fbUserAchievements.val() : undefined;

        userSnapshot.sql.sqlUserCards = sqlUserCards;
        userSnapshot.sql.sqlUserCardCollection = sqlUserCardCollection;
        userSnapshot.sql.sqlUserCardLog = sqlUserCardLog;
        userSnapshot.sql.sqlUserChallenges = sqlUserChallenges;
        userSnapshot.sql.sqlUserCharges = sqlUserCharges;
        userSnapshot.sql.sqlUserCurrencyLog = sqlUserCurrencyLog;
        userSnapshot.sql.sqlUserFactionProgression = sqlUserFactionProgression;
        userSnapshot.sql.sqlUserFactionProgressionEvents = sqlUserFactionProgressionEvents;

        userSnapshot.sql.sqlUserGames = sqlUserGames;
        userSnapshot.sql.sqlUserGauntletRun = sqlUserGauntletRun;
        userSnapshot.sql.sqlUserGauntletRunComplete = sqlUserGauntletRunComplete;
        userSnapshot.sql.sqlUserGauntletTickets = sqlUserGauntletTickets;
        userSnapshot.sql.sqlUserGauntletTicketsUsed = sqlUserGauntletTicketsUsed;
        userSnapshot.sql.sqlUserProgression = sqlUserProgression;

        userSnapshot.sql.sqlUserProgressionDays = sqlUserProgressionDays;
        userSnapshot.sql.sqlUserQuests = sqlUserQuests;
        userSnapshot.sql.sqlUserQuestsComplete = sqlUserQuestsComplete;
        userSnapshot.sql.sqlUserRankEvents = sqlUserRankEvents;
        userSnapshot.sql.sqlUserRankHistory = sqlUserRankHistory;
        userSnapshot.sql.sqlUserRewards = sqlUserRewards;
        userSnapshot.sql.sqlUserSpiritOrbs = sqlUserSpiritOrbs;
        userSnapshot.sql.sqlUserSpiritOrbsOpened = sqlUserSpiritOrbsOpened;

        userSnapshot.sql.sqlUserCodexInventory = sqlUserCodexInventory;
        userSnapshot.sql.sqlUserNewPlayerProgression = sqlUserNewPlayerProgression;
        userSnapshot.sql.sqlUserAchievements = sqlUserAchievements;
        userSnapshot.sql.sqlUserChestRows = sqlUserChestRows;
        userSnapshot.sql.sqlUserChestOpenedRows = sqlUserChestOpenedRows;
        userSnapshot.sql.sqlUserChestKeyRows = sqlUserChestKeyRows;
        userSnapshot.sql.sqlUserChestKeyUsedRows = sqlUserChestKeyUsedRows;

        userSnapshot.sql.sqlUserRow = sqlUserRow;

        Logger.module('UsersModule').timeEnd(`___snapshotUserData() -> retrieving data for user ID ${userId.blue}`.green);

        return userSnapshot;
      });
  }

  /**
	 * Tip your opponent for a specific game
	 * @public
	 * @param	{String}	userId			User ID.
	 * @param	{String}	gameId			Game ID to tip for
	 * @return	{Promise}					Promise that will resolve when complete
	 */
  static tipAnotherPlayerForGame(userId, gameId, goldAmount) {
    if (goldAmount == null) { goldAmount = 5; }
    const MOMENT_NOW_UTC = moment().utc();

    return Promise.all([
      knex('users').where('id', userId).first('username', 'wallet_gold'),
      knex('user_games').where({ user_id: userId, game_id: gameId }).first(),
    ]).spread((userRow, gameRow) => {
      // we need a game row
      if ((gameRow == null)) {
        throw new Errors.NotFoundError('Player game not found');
      }

      // game must be less than a day old
      const timeSinceCreated = moment.duration(MOMENT_NOW_UTC.diff(moment.utc(gameRow.created_at)));
      if (timeSinceCreated.asDays() > 1.0) {
        throw new Errors.BadRequestError('Game is too old');
      }

      // only the winner can tip
      if (!gameRow.is_winner) {
        throw new Errors.BadRequestError('Only the winner can tip');
      }

      // we don't allow multiple tips
      if (gameRow.gold_tip_amount != null) {
        throw new Errors.AlreadyExistsError('Tip already given');
      }

      // we don't allow multiple tips
      if ((userRow != null ? userRow.wallet_gold : undefined) < goldAmount) {
        throw new Errors.InsufficientFundsError('Not enough GOLD to tip');
      }

      // don't allow tips in friendly or sp games
      if ((gameRow.game_type === 'friendly') || (gameRow.game_type === 'single_player')) {
        throw new Errors.BadRequestError('Can not tip in friendly or single player games');
      }

      // grab the opponent id so we know who to tip
      const playerId = gameRow.opponent_id;

      var txPromise = knex.transaction((tx) => Promise.all([
        // debit user's gold
        InventoryModule.debitGoldFromUser(txPromise, tx, userId, -goldAmount, `gold tip to ${gameId}:${playerId}`),
        // give opponent gold
        InventoryModule.giveUserGold(txPromise, tx, playerId, goldAmount, `gold tip from ${gameId}:${userId}`),
        // update user game record
        knex('user_games').where({ user_id: userId, game_id: gameId }).update('gold_tip_amount', goldAmount).transacting(tx),
        // update master game record
        knex('games').where({ id: gameId }).increment('gold_tip_amount', goldAmount).transacting(tx),
        // update master game record
        knex('users').where({ id: userId }).increment('total_gold_tips_given', goldAmount).transacting(tx),
      ]).then(() => Promise.all([
        SyncModule._bumpUserTransactionCounter(tx, userId),
        SyncModule._bumpUserTransactionCounter(tx, playerId),
      ])).then(() => UsersModule.inGameNotify(playerId, `${userRow.username} tipped you ${goldAmount} GOLD`, 'gold tip'))
        .then(tx.commit)
        .catch(tx.rollback));

      return txPromise;
    });
  }

  /**
	 * Suspend a user account
	 * @public
	 * @param	{String}	userId			User ID.
	 * @param	{String}	reasonMemo		Why is this user suspended?
	 * @return	{Promise}					Promise that will resolve when complete
	 */
  static suspendUser(userId, reasonMemo) {
    return knex('users').where('id', userId).update({
      is_suspended: true,
      suspended_at: moment().utc().toDate(),
      suspended_memo: reasonMemo,
    });
  }

  /**
	 * @public
	 * @param	{String}	userId			User ID.
	 * @return	{Promise}					Promise that will resolve when complete
	 */
  static isEligibleForTwitchDrop(userId, itemId = null) {
    return Promise.resolve(true);
  }

  /**
	 * Export a user account data as is (for user requested account export)
	 * @public
	 * @param	{String}	userId			User ID.
	 * @return	{Promise}					Promise that will resolve when complete
	 */
  static exportUser(userId) {
    return UsersModule.___snapshotUserData(userId)
      .then((userData) => // we may want to filter out selective data at this point before exporting
        userData).catch((e) => {
        Logger.module('UsersModule').error(`exportUser() -> ${e.message}`.red);
        return null;
      });
  }

  /**
	 * Anonymize a user (prevents future logins and removes PID)
	 * @public
	 * @param	{String}	userId			User ID.
	 * @return	{Promise}					Promise that will resolve when complete
	 */
  static anonymizeUser(userId) {
    const randomString = crypto.randomBytes(Math.ceil(32)).toString('hex').slice(0, 64);
    const timestamp = moment().utc().valueOf();
    const randomEmail = `${timestamp}-${randomString}@anon.com`;
    const randomUser = `${timestamp}-${randomString}-anon`;

    return UsersModule.userDataForId(userId)
      .then((userRow) => {
        if (!userRow) {
          throw new Errors.NotFoundError();
        }
        return Promise.all([
          UsersModule.disassociateSteamId(userId),
          UsersModule.changeEmail(userId, randomEmail),
          UsersModule.changeUsername(userId, randomUser, true),
        ])
          .catch((e) => // catch the error if any of the functions above fail and continue with suspending the user
            Logger.module('UsersModule').error(`anonymizeUser() partial failure -> ${e.message}`.red));
      }).then(() => UsersModule.suspendUser(userId, 'User requested account deletion.'));
  }
}
UsersModule.initClass();

module.exports = UsersModule;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
