/* eslint-disable
    camelcase,
    consistent-return,
    func-names,
    implicit-arrow-linebreak,
    import/extensions,
    import/no-unresolved,
    max-len,
    no-multi-assign,
    no-param-reassign,
    no-restricted-syntax,
    no-tabs,
    no-underscore-dangle,
    no-use-before-define,
    no-var,
    vars-on-top,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Promise = require('bluebird');
const util = require('util');
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
const InventoryModule = require('./inventory');
const QuestsModule = require('./quests');
const GamesModule = require('./games');
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

// SDK imports
const SDK = require('../../../app/sdk');
const Entity = require('../../../app/sdk/entities/entity');
const QuestFactory = require('../../../app/sdk/quests/questFactory');
const QuestType = require('../../../app/sdk/quests/questTypeLookup');
const GameType = require('../../../app/sdk/gameType');
const UtilsGameSession = require('../../../app/common/utils/utils_game_session.coffee');
const NewPlayerProgressionHelper = require('../../../app/sdk/progression/newPlayerProgressionHelper');
const NewPlayerProgressionStageEnum = require('../../../app/sdk/progression/newPlayerProgressionStageEnum');
const NewPlayerProgressionModuleLookup = require('../../../app/sdk/progression/newPlayerProgressionModuleLookup');

class ChallengesModule {
  static initClass() {
    this.DAILY_CHALLENGE_ALLOWABLE_CLOCK_SKEW_IN_DAYS = 2;
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

    Logger.module('ChallengesModule').time(`completeChallengeWithType() -> user ${userId.blue} completed challenge type ${challengeType}.`);

    return knex('user_challenges').where({ user_id: userId, challenge_id: challengeType }).first()
      .bind(this_obj)
      .then((challengeRow) => {
        if (challengeRow && challengeRow.completed_at) {
          Logger.module('ChallengesModule').debug(`completeChallengeWithType() -> user ${userId.blue} has already completed challenge type ${challengeType}.`);
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
                Logger.module('ChallengesModule').debug(`completeChallengeWithType() -> user ${userId.blue} completed challenge quest rewards count: ${(questProgressResponse != null ? questProgressResponse.rewards.length : undefined)}`);

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
        Logger.module('ChallengesModule').timeEnd(`completeChallengeWithType() -> user ${userId.blue} completed challenge type ${challengeType}.`);

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

    Logger.module('ChallengesModule').time(`markChallengeAsAttempted() -> user ${userId.blue} attempted challenge type ${challengeType}.`);

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
	* Marks a DAILY challenge as completed.
	* @public
	* @param	{String}	userId				User ID.
	* @param	{String}	challengeId			type of challenge
	* @param	{String}	solutionHash		double check against bots # TODO
  * @param  {Moment} completionTime  	UTC Moment to treat the challenge completion as having occurred, defaults to now
  * @param  {Moment} systemTime  			Current time of the system, used for debugging
	* @return	{Promise}						Promise that will resolve on completion
	*/
  static markDailyChallengeAsCompleted(userId, challengeId, solutionHash, completionTime, systemTime) {
    const MOMENT_NOW_UTC = systemTime || moment().utc();
    const completionTimeUtc	= completionTime || MOMENT_NOW_UTC;
    const this_obj = {};

    // Verify a challenge in the future nor more than X days old is attempting to be completed
    if (Math.abs(completionTimeUtc.diff(MOMENT_NOW_UTC, 'days', true)) > ChallengesModule.DAILY_CHALLENGE_ALLOWABLE_CLOCK_SKEW_IN_DAYS) {
      return Promise.reject(new Errors.DailyChallengeTimeFrameError('Attempting to complete a daily challenge outside allowable time frame.'));
    }

    return DuelystFirebase.connect().getRootRef().then((fbRootRef) => FirebasePromises.once(fbRootRef.child('daily-challenges').child(completionTimeUtc.format('YYYY-MM-DD')), 'value')).bind(this_obj)
      .then((snapshot) => {
        Logger.module('ChallengesModule').debug(`markDailyChallengeAsCompleted() -> ${userId.blue} wants to complete challenge ${challengeId} for day ${completionTimeUtc.format('YYYY-MM-DD')}. Challenge Spec: `, snapshot.val());

        if (!snapshot.val()) {
          throw new Errors.NotFoundError('Daily Challenge Not Found');
        }

        if (snapshot.val().challenge_id !== challengeId) {
          throw new Errors.BadRequestError('Invalid Daily Challenge ID');
        }

        var txPromise = knex.transaction((tx) => {
          // lock user and challenge row
          Promise.all([
            knex('user_daily_challenges_completed').where({ user_id: userId, challenge_id: challengeId }).first().forUpdate()
              .transacting(tx),
            knex('users').where({ id: userId }).first('id').forUpdate()
              .transacting(tx),
          ])
            .bind(this_obj)
            .spread(function (challengeRow) {
              this.challengeRow = challengeRow;

              if (this.challengeRow != null) {
                throw new Errors.AlreadyExistsError('Challenge already completed');
              } else {
                //
                let goldAmount;
                const allPromises = [];

                // ...
                this.challengeRow = {
                  user_id: userId,
                  challenge_id: challengeId,
                  reward_ids: [],
                  completed_at: MOMENT_NOW_UTC.toDate(),
                };

                this.goldAmount = (goldAmount = snapshot.val().gold);

                if ((goldAmount != null) && (goldAmount > 0)) {
                  // set up reward data
                  const rewardData = {
                    id: generatePushId(),
                    user_id: userId,
                    reward_category: 'daily challenge',
                    reward_type: challengeId,
                    gold: goldAmount,
                    created_at: MOMENT_NOW_UTC.toDate(),
                    is_unread: true,
                  };

                  // add it to the reward ids column
                  this.challengeRow.reward_ids.push(rewardData.id);

                  // add the promise to our list of reward promises
                  allPromises.push(knex('user_rewards').insert(rewardData).transacting(tx));
                }

                allPromises.push(knex('user_daily_challenges_completed').insert(this.challengeRow).transacting(tx));
                allPromises.push(knex('users').where('id', userId).update({
                  daily_challenge_last_completed_at: completionTimeUtc.toDate(),
                }).transacting(tx));

                //
                return Promise.all(allPromises);
              }
            }).then(function () {
              // if all of the above succeed, update wallet
              return InventoryModule.giveUserGold(txPromise, tx, userId, this.goldAmount, 'daily challenge', challengeId);
            })
            .then(() => SyncModule._bumpUserTransactionCounter(tx, userId))
            .then(tx.commit)
            .catch(tx.rollback);
        }).bind(this_obj)
          .then(function () {
            Logger.module('ChallengesModule').debug(`markDailyChallengeAsCompleted() -> user ${userId.blue} completed challenge ${challengeId} for day ${completionTimeUtc.format('YYYY-MM-DD')}.`);

            const responseData = { challenge: this.challengeRow };
            return responseData;
          });

        return txPromise;
      });
  }
}
ChallengesModule.initClass();

module.exports = ChallengesModule;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
