/* eslint-disable
    camelcase,
    consistent-return,
    func-names,
    guard-for-in,
    implicit-arrow-linebreak,
    import/extensions,
    import/no-unresolved,
    import/order,
    max-len,
    no-console,
    no-loop-func,
    no-nested-ternary,
    no-plusplus,
    no-restricted-syntax,
    no-return-assign,
    no-tabs,
    no-underscore-dangle,
    no-use-before-define,
    no-useless-escape,
    no-var,
    prefer-destructuring,
    prefer-promise-reject-errors,
    radix,
    vars-on-top,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const express = require('express');
const _ = require('underscore');
const Promise = require('bluebird');
const moment = require('moment');
const validator = require('validator');
const t = require('tcomb-validation');
const util = require('util');
const zlib 		= require('zlib');
const CONFIG = require('app/common/config');
const UtilsEnv = require('app/common/utils/utils_env');
const FirebasePromises = require('../../../lib/firebase_promises');
const DuelystFirebase = require('../../../lib/duelyst_firebase_module');
// lib Modules
const UsersModule = require('../../../lib/data_access/users');
const ReferralsModule = require('../../../lib/data_access/referrals');
const RiftModule = require('../../../lib/data_access/rift');
const InventoryModule = require('../../../lib/data_access/inventory');
const QuestsModule = require('../../../lib/data_access/quests');
const GauntletModule = require('../../../lib/data_access/gauntlet');
const CosmeticChestsModule = require('../../../lib/data_access/cosmetic_chests');
const AchievementsModule = require('../../../lib/data_access/achievements');
const GiftCrateModule = require('../../../lib/data_access/gift_crate');
let SyncModule = require('../../../lib/data_access/sync');
const RankModule = require('../../../lib/data_access/rank');
SyncModule = require('../../../lib/data_access/sync');
const ShopModule = require('../../../lib/data_access/shop');
const TwitchModule = require('../../../lib/data_access/twitch');
const knex = require('../../../lib/data_access/knex');
const DataAccessHelpers = require('../../../lib/data_access/helpers');
const Logger = require('../../../../app/common/logger');
const Errors = require('../../../lib/custom_errors');
// sdk
const SDK = require('../../../../app/sdk');
const FactionFactory = require('../../../../app/sdk/cards/factionFactory');
const RankFactory = require('../../../../app/sdk/rank/rankFactory');
const GiftCrateLookup = require('../../../../app/sdk/giftCrates/giftCrateLookup');
const CosmeticsLookup = require('../../../../app/sdk/cosmetics/cosmeticsLookup');
const GameSession = require('../../../../app/sdk/gameSession');
const Redis = require('../../../redis');
const { SRankManager } = require('../../../redis');

// Daily challenges
const config 		= require('../../../../config/config.js');
const generatePushId = require('../../../../app/common/generate_push_id');

const { Jobs } = require('../../../redis');

// create a S3 API client
const AWS 		= require('aws-sdk');

AWS.config.update({
  accessKeyId: config.get('s3_archive.key'),
  secretAccessKey: config.get('s3_archive.secret'),
});
const s3 = new AWS.S3();
// Promise.promisifyAll(s3)

const rankedQueue = new Redis.PlayerQueue(Redis.Redis, { name: 'ranked' });
const router = express.Router();

Logger.module('EXPRESS').log('QA routes ACTIVE'.green);

router.delete('/rank/history/:season_key/rewards', (req, res, next) => {
  const user_id = req.user.d.id;
  const {
    season_key,
  } = req.params;

  if (!validator.matches(season_key, /^[0-9]{4}\-[0-9]{2}/i)) {
    return next(new Errors.BadRequestError());
  }

  const season_starting_at = moment(`${season_key} +0000`, 'YYYY-MM Z').utc();
  knex('user_rank_history').where({ user_id, starting_at: season_starting_at.toDate() }).first().then((row) => console.log('found: ', row));
  return knex('user_rank_history').where({ user_id, starting_at: season_starting_at.toDate() }).update({
    rewards_claimed_at: null,
    reward_ids: null,
    is_unread: true,
  }).then((updateCount) => res.status(200).json({}));
});

router.put('/rank/history/:season_key/top_rank', (req, res, next) => {
  const user_id = req.user.d.id;
  const {
    season_key,
  } = req.params;
  const {
    rank,
  } = req.body;

  if (!validator.matches(season_key, /^[0-9]{4}\-[0-9]{2}/i)) {
    return next(new Errors.BadRequestError());
  }

  const season_starting_at = moment(`${season_key} +0000`, 'YYYY-MM Z').utc();
  return knex('user_rank_history').where({ user_id, starting_at: season_starting_at.toDate() }).update({
    top_rank: rank,
  }).then(() => res.status(200).json({}));
});

// Updates the users current rank (and top rank if appropriate)
router.put('/rank', (req, res, next) => {
  const MOMENT_UTC_NOW = moment().utc();

  const user_id = req.user.d.id;
  const {
    rank,
  } = req.body;

  return knex('users').where({ id: user_id }).first()
    .bind({})
    .then(function (row) {
      this.userRow = row;
      this.updateData = {
        rank,
        rank_stars: 0,
      };
      if (rank < row.rank_top_rank) {
        this.updateData.rank_top_rank = rank;
      }
      if (rank < row.top_rank) {
        this.updateData.top_rank = rank;
      }

      return knex('users').where({ id: user_id }).update(this.updateData);
    })
    .then(() => DuelystFirebase.connect().getRootRef())
    .then(function (fbRootRef) {
      this.fbRootRef = fbRootRef;
      FirebasePromises.set(this.fbRootRef.child('user-ranking').child(user_id).child('current'), {
        rank: parseInt(this.updateData.rank),
        stars: this.updateData.rank_stars,
        stars_required: RankFactory.starsNeededToAdvanceRank(this.updateData.rank) || 0,
        updated_at: MOMENT_UTC_NOW.valueOf() || null,
        created_at: moment.utc(this.userRow.rank_created_at).valueOf(),
        starting_at: moment.utc(this.userRow.rank_starting_at).valueOf(),
      });

      if (this.updateData.top_rank != null) {
        return FirebasePromises.set(this.fbRootRef.child('user-ranking').child(user_id).child('top'), {
          rank: parseInt(this.updateData.top_rank),
          updated_at: MOMENT_UTC_NOW.valueOf() || null,
          created_at: moment.utc(this.userRow.rank_created_at).valueOf(),
          starting_at: moment.utc(this.userRow.rank_starting_at).valueOf(),
        });
      }
    })
    .then(() => // TODO: Remove rating data from fb and database if rank is not 0
      Promise.resolve())
    .then(function () {
      return res.status(200).json({
        rank: this.updateData.rank,
        top_rank: (this.updateData.rank_top_rank != null) ? this.updateData.rank_top_rank : this.userRow.rank_top_rank,
      });
    });
});

// Updates the users current s rank rating
router.put('/rank_rating', (req, res, next) => {
  let txPromise;
  const MOMENT_UTC_NOW = moment().utc();
  const startOfSeasonMonth = moment(MOMENT_UTC_NOW).utc().startOf('month');
  const seasonStartingAt = startOfSeasonMonth.toDate();

  const user_id = req.user.d.id;
  const {
    rank_rating,
  } = req.body;
  const userRatingRowData = {
    rating: rank_rating,
    updated_at: MOMENT_UTC_NOW.toDate(),
  };

  let newLadderPosition = null;

  return txPromise = knex.transaction((tx) => {
    tx('user_rank_ratings').where('user_id', user_id).andWhere('season_starting_at', seasonStartingAt).first()
      .then((userRankRatingRow) => {
        // Update or insert
        if (userRankRatingRow != null) {
          userRatingRowData.ladder_rating = RankModule._ladderRatingForRatingAndWinCount(userRatingRowData.rating, userRankRatingRow.srank_win_count);
          return tx('user_rank_ratings').where('user_id', user_id).andWhere('season_starting_at', seasonStartingAt).update(userRatingRowData);
        }
        return tx('user_rank_ratings').insert({
          user_id,
          season_starting_at: seasonStartingAt,
          rating: rank_rating,
          ladder_rating: RankModule._ladderRatingForRatingAndWinCount(rank_rating, 0),
          top_rating: rank_rating,
          rating_deviation: 200,
          volatility: 0.06,
          created_at: MOMENT_UTC_NOW.toDate(),
          updated_at: MOMENT_UTC_NOW.toDate(),
        });
      })
      .then(() => RankModule.updateAndGetUserLadderPosition(txPromise, tx, user_id, startOfSeasonMonth, MOMENT_UTC_NOW))
      .then((ladderPosition) => newLadderPosition = ladderPosition)
      .then(tx.commit)
      .catch(tx.rollback);
  }).then(() => res.status(200).json({ ladder_position: newLadderPosition }));
});

// Resets the users current s rank rating
router.delete('/rank_rating', (req, res, next) => {
  const MOMENT_UTC_NOW = moment().utc();
  const startOfSeasonMonth = moment(MOMENT_UTC_NOW).utc().startOf('month');
  const seasonStartingAt = startOfSeasonMonth.toDate();

  const user_id = req.user.d.id;

  return Promise.all([
    knex('user_rank_ratings').where('user_id', user_id).andWhere('season_starting_at', seasonStartingAt).delete(),
    knex('user_rank_ratings').where('user_id', user_id).andWhere('season_starting_at', seasonStartingAt).delete(),
  ]).then(() => DuelystFirebase.connect().getRootRef()).then((fbRootRef) => FirebasePromises.remove(fbRootRef.child('users').child(user_id).child('presence').child('ladder_position'))).then(() => res.status(200).json({}));
});

// Retrieves the users current s rank rating data
router.get('/rank_rating', (req, res, next) => {
  let txPromise;
  const MOMENT_UTC_NOW = moment().utc();
  const startOfSeasonMonth = moment(MOMENT_UTC_NOW).utc().startOf('month');
  const seasonStartingAt = startOfSeasonMonth.toDate();

  const user_id = req.user.d.id;

  let user_rating_data = null;

  return txPromise = knex.transaction((tx) => {
    RankModule.getUserRatingData(tx, user_id, MOMENT_UTC_NOW)
      .then((userRatingRow) => user_rating_data = userRatingRow || {})
      .then(tx.commit)
      .catch(tx.rollback);
  }).then(() => res.status(200).json({ user_rating_data }));
});

// Retrieves the users current s rank ladder position (Does not update it anywhere)
router.get('/ladder_position', (req, res, next) => {
  let txPromise;
  const MOMENT_UTC_NOW = moment().utc();
  const startOfSeasonMonth = moment(MOMENT_UTC_NOW).utc().startOf('month');
  const seasonStartingAt = startOfSeasonMonth.toDate();

  const user_id = req.user.d.id;

  let user_ladder_position = null;

  return txPromise = knex.transaction((tx) => {
    RankModule.getUserLadderPosition(tx, user_id, startOfSeasonMonth, MOMENT_UTC_NOW)
      .then((userLadderPosition) => user_ladder_position = userLadderPosition || null).then(tx.commit)
      .catch(tx.rollback);
  }).then(() => res.status(200).json({ user_ladder_position }));
});

// Marks the current season as last season (so that it is ready to be cycled) and deletes last season from history if needed
router.delete('/rank/history/last', (req, res, next) => {
  const MOMENT_UTC_NOW = moment().utc();

  const previous_season_key = moment().utc().subtract(1, 'month').format('YYYY-MM');
  const previous_season_starting_at = moment(`${previous_season_key} +0000`, 'YYYY-MM Z').utc();

  const current_season_key = moment().utc().format('YYYY-MM');
  const current_season_starting_at = moment(`${current_season_key} +0000`, 'YYYY-MM Z').utc();

  const user_id = req.user.d.id;

  return Promise.all([
    knex('user_rank_history').where({ user_id, starting_at: previous_season_starting_at.toDate() }).delete(),
    knex('user_rank_ratings').where({ user_id, season_starting_at: previous_season_starting_at.toDate() }).delete(),
  ])
    .bind({})
    .then(function () {
      this.updateUserData = {
        rank_starting_at: previous_season_starting_at.toDate(),
      };

      this.updateRankRatingData = {
        season_starting_at: previous_season_starting_at.toDate(),
      };

      return Promise.all([
        knex('users').where({ id: user_id }).update(this.updateUserData),
        knex('user_rank_ratings').where({ user_id, season_starting_at: current_season_starting_at }).update(this.updateRankRatingData),
        SRankManager._removeUserFromLadder(user_id, moment.utc(current_season_starting_at)),
      ]);
    }).then(() => res.status(200).json({}));
});

router.post('/inventory/spirit', (req, res, next) => {
  let txPromise;
  const user_id = req.user.d.id;
  const {
    amount,
  } = req.body;

  return txPromise = knex.transaction((tx) => {
    InventoryModule.giveUserSpirit(txPromise, tx, user_id, amount, 'QA gift')
      .then(tx.commit)
      .catch(tx.rollback);
  }).then(() => res.status(200).json({}));
});

router.post('/inventory/gold', (req, res, next) => {
  let txPromise;
  const user_id = req.user.d.id;
  const {
    amount,
  } = req.body;

  return txPromise = knex.transaction((tx) => {
    InventoryModule.giveUserGold(txPromise, tx, user_id, amount, 'QA gift')
      .then(tx.commit)
      .catch(tx.rollback);
  }).then(() => res.status(200).json({}));
});

router.post('/inventory/premium', (req, res, next) => {
  let txPromise;
  const user_id = req.user.d.id;
  const {
    amount,
  } = req.body;

  return txPromise = knex.transaction((tx) => {
    if (amount > 0) {
      return InventoryModule.giveUserPremium(txPromise, tx, user_id, amount, 'QA gift');
    }
    return InventoryModule.debitPremiumFromUser(txPromise, tx, user_id, -amount, 'QA charge');
  }).then(() => res.status(200).json({}));
});

router.post('/inventory/rift_ticket', (req, res, next) => {
  let txPromise;
  const user_id = req.user.d.id;

  return txPromise = knex.transaction((tx) => {
    //		InventoryModule.giveUserGold(txPromise,tx,user_id,amount,'QA gift')
    RiftModule.addRiftTicketToUser(txPromise, tx, user_id, 'qa gift', generatePushId())
      .then(tx.commit)
      .catch(tx.rollback);
  }).then(() => res.status(200).json({}));
});

router.post('/inventory/cards', (req, res, next) => {
  let txPromise;
  const user_id = req.user.d.id;
  const cardIds = req.body.card_ids;

  if (!cardIds || ((cardIds != null ? cardIds.length : undefined) <= 0)) {
    return res.status(400).json({});
  }

  return txPromise = knex.transaction((tx) => InventoryModule.giveUserCards(txPromise, tx, user_id, cardIds, 'QA', 'QA', 'QA gift')).then(() => res.status(200).json({}));
});

router.post('/inventory/card_set_with_spirit', (req, res, next) => {
  let txPromise;
  const user_id = req.user.d.id;
  const cardSetId = req.body.card_set_id;

  return txPromise = knex.transaction((tx) => InventoryModule.buyRemainingSpiritOrbsWithSpirit(user_id, cardSetId)).then(() => res.status(200).json({})).catch((errorMessage) => res.status(500).json({ message: errorMessage }));
});

router.post('/inventory/fill_collection', (req, res, next) => {
  const user_id = req.user.d.id;

  var txPromise = knex.transaction((tx) => tx('user_card_collection').where('user_id', user_id).first()
    .then((cardCollectionRow) => {
      const missingCardIds = [];
      _.each(SDK.GameSession.getCardCaches().getIsCollectible(true).getIsUnlockable(false).getIsPrismatic(false)
        .getCardIds(), (cardId) => {
        let numMissing;
        if ((cardCollectionRow != null) && (cardCollectionRow.cards != null)) {
          const cardData = cardCollectionRow.cards[cardId];
          numMissing = 0;
          if (SDK.CardFactory.cardForIdentifier(cardId).getRarityId() === SDK.Rarity.Mythron) {
            if ((cardData == null)) {
              numMissing = 1;
            } else if (cardData != null) {
              numMissing = Math.max(0, 1 - cardData.count);
            }
          } else if ((cardData == null)) {
            numMissing = CONFIG.MAX_DECK_DUPLICATES;
          } else if (cardData != null) {
            numMissing = Math.max(0, CONFIG.MAX_DECK_DUPLICATES - cardData.count);
          }
        } else {
          // If no card collection yet then they are missing all of this card
          numMissing = CONFIG.MAX_DECK_DUPLICATES;
          if (SDK.CardFactory.cardForIdentifier(cardId).getRarityId() === SDK.Rarity.Mythron) {
            numMissing = 1;
          }
        }

        if (numMissing > 0) {
          return __range__(0, numMissing, false).map((i) => missingCardIds.push(cardId));
        }
      });

      if (missingCardIds.length > 0) {
        return InventoryModule.giveUserCards(txPromise, tx, user_id, missingCardIds, 'QA', 'QA', 'QA gift');
      }
      return Promise.resolve();
    }));

  return txPromise.then(() => res.status(200).json({}));
});

router.delete('/inventory/unused', (req, res, next) => {
  let txPromise;
  const user_id = req.user.d.id;
  const this_obj = {};

  return txPromise = knex.transaction((tx) => tx('user_card_collection').where('user_id', user_id).first()
    .bind(this_obj)
    .then(function (cardCollectionRow) {
      this.newCardCollection = {};
      this.ownedUnusedCards = [];

      for (const cardId in cardCollectionRow.cards) {
        const cardCountData = cardCollectionRow.cards[cardId];
        const sdkCard = SDK.GameSession.getCardCaches().getCardById(cardId);
        if (!sdkCard) {
          this.ownedUnusedCards.push(cardId);
        } else {
          this.newCardCollection[cardId] = cardCountData;
        }
      }

      return tx('user_card_collection').where('user_id', user_id).update({
        cards: this.newCardCollection,
      });
    })
    .then(function () {
      return Promise.map(this.ownedUnusedCards, (cardId) => tx('user_cards').where('user_id', user_id).andWhere('card_id', cardId).delete());
    })).then(() => SyncModule._syncUserFromSQLToFirebase(user_id)).then(() => res.status(200).json({}));
});

router.delete('/inventory/bloodborn', (req, res, next) => {
  let txPromise;
  const user_id = req.user.d.id;
  const this_obj = {};

  return txPromise = knex.transaction((tx) => tx('user_card_collection').where('user_id', user_id).first()
    .bind(this_obj)
    .then(function (cardCollectionRow) {
      this.newCardCollection = {};
      this.ownedBloodbornCards = [];

      for (const cardId in cardCollectionRow.cards) {
        const cardCountData = cardCollectionRow.cards[cardId];
        const sdkCard = SDK.GameSession.getCardCaches().getCardById(cardId);
        if (sdkCard.getCardSetId() === SDK.CardSet.Bloodborn) {
          this.ownedBloodbornCards.push(cardId);
        } else {
          this.newCardCollection[cardId] = cardCountData;
        }
      }

      return tx('user_card_collection').where('user_id', user_id).update({
        cards: this.newCardCollection,
      });
    })
    .then(function () {
      return Promise.map(this.ownedBloodbornCards, (cardId) => tx('user_cards').where('user_id', user_id).andWhere('card_id', cardId).delete());
    })
    .then(() => Promise.all([
      tx('user_spirit_orbs_opened').where('user_id', user_id).andWhere('card_set', SDK.CardSet.Bloodborn).delete(),
      tx('user_spirit_orbs').where('user_id', user_id).andWhere('card_set', SDK.CardSet.Bloodborn).delete(),
      tx('users').where('id', user_id).update({
        total_orb_count_set_3: 0,
      }),
    ]))).then(() => SyncModule._syncUserFromSQLToFirebase(user_id)).then(() => res.status(200).json({}));
});

router.delete('/inventory/unity', (req, res, next) => {
  let txPromise;
  const user_id = req.user.d.id;
  const this_obj = {};

  return txPromise = knex.transaction((tx) => tx('user_card_collection').where('user_id', user_id).first()
    .bind(this_obj)
    .then(function (cardCollectionRow) {
      this.newCardCollection = {};
      this.ownedUnityCards = [];

      for (const cardId in cardCollectionRow.cards) {
        const cardCountData = cardCollectionRow.cards[cardId];
        const sdkCard = SDK.GameSession.getCardCaches().getCardById(cardId);
        if (sdkCard.getCardSetId() === SDK.CardSet.Unity) {
          this.ownedUnityCards.push(cardId);
        } else {
          this.newCardCollection[cardId] = cardCountData;
        }
      }

      return tx('user_card_collection').where('user_id', user_id).update({
        cards: this.newCardCollection,
      });
    })
    .then(function () {
      return Promise.map(this.ownedUnityCards, (cardId) => tx('user_cards').where('user_id', user_id).andWhere('card_id', cardId).delete());
    })
    .then(() => Promise.all([
      tx('user_spirit_orbs_opened').where('user_id', user_id).andWhere('card_set', SDK.CardSet.Unity).delete(),
      tx('user_spirit_orbs').where('user_id', user_id).andWhere('card_set', SDK.CardSet.Unity).delete(),
      tx('users').where('id', user_id).update({
        total_orb_count_set_4: null,
      }),
    ]))).then(() => SyncModule._syncUserFromSQLToFirebase(user_id)).then(() => res.status(200).json({}));
});

router.delete('/quests/current', (req, res, next) => {
  const user_id = req.user.d.id;

  const twoDaysAgoMoment = moment.utc().subtract(2, 'day');

  return knex('user_quests').where({ user_id }).delete()
    .then(() => knex('users').where('id', user_id).update({
      free_card_of_the_day_claimed_at: twoDaysAgoMoment.toDate(),
    }))
    .then(() => DuelystFirebase.connect().getRootRef())
    .then(function (fbRootRef) {
      this.fbRootRef = fbRootRef;

      return Promise.all([
        FirebasePromises.remove(this.fbRootRef.child('user-quests').child(user_id).child('daily').child('current')
          .child('quests')),
        FirebasePromises.remove(this.fbRootRef.child('user-quests').child(user_id).child('catch-up').child('current')
          .child('quests')),
        FirebasePromises.set(this.fbRootRef.child('users').child(user_id).child('free_card_of_the_day_claimed_at'), twoDaysAgoMoment.valueOf()),
      ]);
    })
    .then(() => QuestsModule.generateDailyQuests(user_id))
    .then(() => res.status(200).json({}));
});

router.put('/quests/current', (req, res, next) => {
  const user_id = req.user.d.id;
  const {
    quest_ids,
  } = req.body;

  // wipe old quests and regenerate just to treat this like a fresh generation
  return knex('user_quests').where({ user_id }).delete()
    .then(() => DuelystFirebase.connect().getRootRef())
    .then(function (fbRootRef) {
      this.fbRootRef = fbRootRef;

      return Promise.all([
        FirebasePromises.remove(this.fbRootRef.child('user-quests').child(user_id).child('daily').child('current')
          .child('quests')),
        FirebasePromises.remove(this.fbRootRef.child('user-quests').child(user_id).child('catch-up').child('current')
          .child('quests')),
      ]);
    })
    .then(() => QuestsModule.generateDailyQuests(user_id))
    .then(() => Promise.all([
      QuestsModule.mulliganDailyQuest(user_id, 0, null, quest_ids[0]),
      QuestsModule.mulliganDailyQuest(user_id, 1, null, quest_ids[1]),
    ]))
    .then(function () {
      return Promise.all([
        knex('user_quests').where({ user_id }).update({ mulliganed_at: null }),
        FirebasePromises.remove(this.fbRootRef.child('user-quests').child(user_id).child('daily').child('current')
          .child('quests')
          .child(0)
          .child('mulliganed_at')),
        FirebasePromises.remove(this.fbRootRef.child('user-quests').child(user_id).child('daily').child('current')
          .child('quests')
          .child(1)
          .child('mulliganed_at')),
      ]);
    })
    .then(() => res.status(200).json({}));
});

router.put('/quests/current/progress', (req, res, next) => {
  const user_id = req.user.d.id;
  const {
    quest_slots,
  } = req.body;
  var txPromise = knex.transaction((tx) => Promise.each(quest_slots, (quest_slot) => tx('user_quests').first().where({ user_id, quest_slot_index: quest_slot })
    .then((questRow) => {
      if (questRow != null) {
        let newProgress = questRow.progress || 0;
        newProgress += 1;

        return QuestsModule._setQuestProgress(txPromise, tx, questRow, newProgress);
      }
      return Promise.resolve();
    })));

  return txPromise
    .then(() => res.status(200).json({})).catch((errorMessage) => res.status(500).json({ message: errorMessage }));
});

router.put('/quests/generated_at', (req, res, next) => {
  const user_id = req.user.d.id;
  const {
    days_back,
  } = req.body;

  return knex('users').where({ id: user_id }).first('daily_quests_generated_at')
    .bind({})
    .then(function (row) {
      this.previousGeneratedAt = row.daily_quests_generated_at;
      this.newGeneratedAtMoment = moment.utc(row.daily_quests_generated_at).subtract(days_back, 'days');
      this.userRow = row;
      this.updateData = {
        daily_quests_generated_at: this.newGeneratedAtMoment.toDate(),
      };

      return knex('users').where({ id: user_id }).update(this.updateData);
    })
    .then(() => DuelystFirebase.connect().getRootRef())
    .then(function (fbRootRef) {
      this.fbRootRef = fbRootRef;

      return Promise.all([
        FirebasePromises.set(this.fbRootRef.child('user-quests').child(user_id).child('daily').child('current')
          .child('updated_at'), this.newGeneratedAtMoment.valueOf()),
        FirebasePromises.set(this.fbRootRef.child('user-quests').child(user_id).child('daily').child('current')
          .child('generated_at'), this.newGeneratedAtMoment.valueOf()),
      ]);
    })
    .then(function () {
      return res.status(200).json({
        generated_at: this.newGeneratedAtMoment.valueOf(),
      });
    });
});

router.post('/quests/setup_frostfire_2016', (req, res, next) => {
  const user_id = req.user.d.id;

  return Promise.all([
    knex('users').where({ id: user_id }).update({
      daily_quests_generated_at: null,
      daily_quests_updated_at: null,
    }),
    knex('user_quests').where('user_id', user_id).delete(),
    knex('user_quests_complete').where('user_id', user_id).andWhere('quest_type_id', 30001).delete(),
  ]).then(() => QuestsModule.generateDailyQuests(user_id, moment.utc('2016-12-02'))).then(() => Promise.all([
    QuestsModule.mulliganDailyQuest(user_id, 0, moment.utc('2016-12-02'), 101),
    QuestsModule.mulliganDailyQuest(user_id, 1, moment.utc('2016-12-02'), 101),
  ])).then(() => Promise.all([
    knex('user_quests').where('quest_slot_index', 0).andWhere('user_id', user_id).update({ progress: 3 }),
    knex('user_quests').where('quest_slot_index', 1).andWhere('user_id', user_id).update({ progress: 3 }),
    knex('user_quests').where('quest_slot_index', QuestsModule.SEASONAL_QUEST_SLOT).andWhere('user_id', user_id).update({ progress: 13 }),
  ]))
    .then(() => SyncModule._syncUserFromSQLToFirebase(user_id))
    .then(() => res.status(200).json({}));
});

router.post('/quests/setup_seasonal_quest', (req, res, next) => {
  const user_id = req.user.d.id;
  const generateQuestsAt = req.body.generate_quests_at;

  const generateQuestsAtMoment = moment.utc(generateQuestsAt);

  const sdkQuestForGenerationTime = SDK.QuestFactory.seasonalQuestForMoment(generateQuestsAtMoment);

  if ((sdkQuestForGenerationTime == null)) {
    res.status(403).json({ message: `No seasonal quest for: ${generateQuestsAtMoment.toString()}` });
    return;
  }

  return Promise.all([
    knex('users').where({ id: user_id }).update({
      daily_quests_generated_at: null,
      daily_quests_updated_at: null,
    }),
    knex('user_quests').where('user_id', user_id).delete(),
    knex('user_quests_complete').where('user_id', user_id).andWhere('quest_type_id', sdkQuestForGenerationTime.getId()).delete(),
  ]).then(() => QuestsModule.generateDailyQuests(user_id, generateQuestsAtMoment)).then(() => Promise.all([
    QuestsModule.mulliganDailyQuest(user_id, 0, generateQuestsAtMoment, 101),
    QuestsModule.mulliganDailyQuest(user_id, 1, generateQuestsAtMoment, 1500),
  ])).then(() => Promise.all([
    knex('user_quests').where('quest_slot_index', 0).andWhere('user_id', user_id).update({ progress: 3 }),
    knex('user_quests').where('quest_slot_index', 1).andWhere('user_id', user_id).update({ progress: 7 }),
    knex('user_quests').where('quest_slot_index', QuestsModule.SEASONAL_QUEST_SLOT).andWhere('user_id', user_id).update({ progress: 13 }),
  ]))
    .then(() => SyncModule._syncUserFromSQLToFirebase(user_id))
    .then(() => res.status(200).json({}));
});

router.post('/quests/setup_promotional_quest', (req, res, next) => {
  const user_id = req.user.d.id;
  const generateQuestsAt = req.body.generate_quests_at;

  const generateQuestsAtMoment = moment.utc(generateQuestsAt);

  const sdkQuestForGenerationTime = SDK.QuestFactory.promotionalQuestForMoment(generateQuestsAtMoment);
  const progressToStartWith = sdkQuestForGenerationTime.params.completionProgress - 1;

  if ((sdkQuestForGenerationTime == null)) {
    res.status(403).json({ message: `No promo quest for: ${generateQuestsAtMoment.toString()}` });
    return;
  }

  return Promise.all([
    knex('users').where({ id: user_id }).update({
      daily_quests_generated_at: null,
      daily_quests_updated_at: null,
    }),
    knex('user_quests').where('user_id', user_id).delete(),
    knex('user_quests_complete').where('user_id', user_id).andWhere('quest_type_id', sdkQuestForGenerationTime.getId()).delete(),
  ]).then(() => QuestsModule.generateDailyQuests(user_id, generateQuestsAtMoment)).then(() => Promise.all([
    knex('user_quests').where('quest_slot_index', QuestsModule.PROMOTIONAL_QUEST_SLOT).andWhere('user_id', user_id).update({ progress: progressToStartWith }),
  ])).then(() => SyncModule._syncUserFromSQLToFirebase(user_id))
    .then(() => res.status(200).json({}));
});

router.post('/matchmaking/time_series/:division/values', (req, res, next) => {
  const {
    division,
  } = req.params;
  const {
    ms,
  } = req.body;

  rankedQueue.matchMade(division, ms);

  return res.status(200).json({});
});

router.post('/faction_progression/set_all_win_counts_to_99', (req, res, next) => {
  const user_id = req.user.d.id;

  return knex('user_faction_progression').where('user_id', user_id)
    .then((rows) => {
      const all = [];
      const factionIds = _.map(FactionFactory.getAllPlayableFactions(), (f) => f.id);
      Logger.module('QA').log('factionIds ', factionIds);
      for (var factionId of Array.from(factionIds)) {
        const row = _.find(rows, (r) => r.faction_id === factionId);
        Logger.module('QA').log(`faction ${factionId}`, row != null ? row.user_id : undefined);
        if (row != null) {
          all.push(knex('user_faction_progression').where({
            user_id,
            faction_id: row.faction_id,
          }).update({
            win_count: 99,
          }));
        }
      }
      return Promise.all(all);
    }).then(() => res.status(200).json({}));
});

router.post('/faction_progression/add_level', (req, res, next) => {
  const user_id = req.user.d.id;
  const factionId = req.body.faction_id;
  if (factionId != null) {
    return knex('user_faction_progression').where({ user_id, faction_id: factionId }).first()
      .then((factionProgressionRow) => {
        if ((factionProgressionRow == null)) {
          return UsersModule.createFactionProgressionRecord(user_id, factionId, generatePushId(), SDK.GameType.Ranked);
        }
      })
      .then(() => knex('user_faction_progression').where({ user_id, faction_id: factionId }).first())
      .then((factionProgressionRow) => {
        if ((factionProgressionRow == null)) {
          return Promise.reject(`No row found for faction ${factionId}`);
        }
        const currentXP = factionProgressionRow.xp || 0;
        const currentLevel = SDK.FactionProgression.levelForXP(currentXP);
        const nextLevel = currentLevel + 1;
        const nextLevelXP = SDK.FactionProgression.totalXPForLevel(nextLevel);
        const deltaXP = nextLevelXP - currentXP;
        if (deltaXP <= 0) {
          return Promise.reject(`Cannot increase level for faction ${factionId}, currently at ${currentLevel}`);
        }
        const winsNeeded = Math.ceil(deltaXP / SDK.FactionProgression.winXP);
        const promises = [];
        for (let i = 0, end = winsNeeded, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
          promises.push(UsersModule.updateUserFactionProgressionWithGameOutcome(user_id, factionId, true, generatePushId(), SDK.GameType.Ranked));
        }
        return Promise.all(promises);
      })
      .then(() => res.status(200).json({}))
      .catch((errorMessage) => res.status(500).json({ message: errorMessage }));
  }
});

router.post('/faction_progression/set_all_levels_to_10', (req, res, next) => {
  const user_id = req.user.d.id;

  return knex('user_faction_progression').where('user_id', user_id)
    .then((rows) => {
      const factionIds = _.map(FactionFactory.getAllPlayableFactions(), (f) => f.id);
      const allPromises = [];
      for (var factionId of Array.from(factionIds)) {
        const row = _.find(rows, (r) => r.faction_id === factionId);
        if ((row == null)) {
          allPromises.push(UsersModule.createFactionProgressionRecord(user_id, factionId, generatePushId(), SDK.GameType.SinglePlayer));
        }
      }
      return Promise.all(allPromises);
    }).then(() => knex('user_faction_progression').where('user_id', user_id))
    .then((factionRows) => {
      const factionIds = _.map(FactionFactory.getAllPlayableFactions(), (f) => f.id);
      let winsPerFaction = [];
      for (var factionId of Array.from(factionIds)) {
        const row = _.find(factionRows, (r) => r.faction_id === factionId);
        if ((row == null)) {
          return Promise.reject(`No row found for faction - ${factionId}`);
        }
        const factionXp = row.xp;
        const xpForLevelTen = SDK.FactionProgression.levelXPTable[10];
        const neededXp = xpForLevelTen - factionXp;
        const xpPerWin = SDK.FactionProgression.winXP;
        if (neededXp > 0) {
          const neededWins = Math.ceil(neededXp / xpPerWin);
          winsPerFaction = winsPerFaction.concat(Array(neededWins).fill(factionId));
        }
      }
      return Promise.each(winsPerFaction, (factionId) => UsersModule.updateUserFactionProgressionWithGameOutcome(user_id, factionId, true, generatePushId(), SDK.GameType.Ranked));
    })
    .then(() => res.status(200).json({}))
    .catch((errorMessage) => res.status(500).json({ message: errorMessage }));
});

router.delete('/gauntlet/current', (req, res, next) => {
  const userId = req.user.d.id;

  return DuelystFirebase.connect().getRootRef()
    .then((fbRootRef) => Promise.all([
      knex('user_gauntlet_run').where('user_id', userId).delete(),
      FirebasePromises.remove(fbRootRef.child('user-gauntlet-run').child(userId).child('current')),
    ])).then(() => res.status(200).json({}))
    .catch((error) => res.status(403).json({ message: error.toString() }));
});

router.delete('/gauntlet/current/general', (req, res, next) => {
  const userId = req.user.d.id;

  // Get current gauntlet data
  return knex('user_gauntlet_run').first().where('user_id', userId)
    .bind({})
    .then(function (gauntletData) {
      this.gauntletData = gauntletData;
      if ((gauntletData == null)) {
        return Promise.reject(new Error('You are not currently in a Gauntlet Run'));
      }

      if (!gauntletData.is_complete) {
        return Promise.reject(new Error('Current Gauntlet deck is not complete'));
      }

      const cardIdInGeneralSlot = gauntletData.deck[0];
      const sdkCard = GameSession.getCardCaches().getCardById(cardIdInGeneralSlot);
      if (!sdkCard.getIsGeneral()) {
        return Promise.reject(new Error('Current Gauntlet deck does not have general in expected slot'));
      }

      this.newDeck = gauntletData.deck.slice(1);

      return DuelystFirebase.connect().getRootRef();
    })
    .then(function (fbRootRef) {
      const updateData = {
        deck: this.newDeck,
        general_id: null,
      };
      return Promise.all([
        knex('user_gauntlet_run').where('user_id', userId).update(updateData),
        FirebasePromises.update(fbRootRef.child('user-gauntlet-run').child(userId).child('current'), updateData),
      ]);
    })
    .then(function () {
      return res.status(200).json(this.gauntletData);
    })
    .catch((error) => res.status(403).json({ message: error.toString() }));
});

router.post('/gauntlet/progress', (req, res, next) => {
  const userId = req.user.d.id;
  const isWinner = req.body.is_winner;

  return Redis.GameManager.generateGameId()
    .then((gameId) => GauntletModule.updateArenaRunWithGameOutcome(userId, isWinner, gameId, false)).then((runData) => res.status(200).json(runData)).catch((error) => res.status(403).json({ message: error.toString() }));
});

router.post('/gauntlet/fill_deck', (req, res, next) => {
  const userId = req.user.d.id;

  // Get current gauntlet data
  return knex('user_gauntlet_run').first().where('user_id', userId)
    .then((gauntletData) => {
      var recursiveSelect = function (gauntletData) {
        if ((gauntletData == null) || (gauntletData.card_choices == null) || (gauntletData.card_choices[0] == null)) {
          // No more card choices
          return res.status(200).json(gauntletData);
        }
        let cardIdChoice = null;
        if (gauntletData.card_choices != null) {
          cardIdChoice = gauntletData.card_choices[0];
        } else if (gauntletData.general_choices != null) {
          cardIdChoice = gauntletData.general_choices[0];
        }
        return GauntletModule.chooseCard(userId, cardIdChoice)
          .then((newGauntletData) => recursiveSelect(newGauntletData));
      };
      return recursiveSelect(gauntletData);
    })
    .catch((error) => res.status(403).json({ message: error.message }));
});

router.post('/gift_crate/winter2015', (req, res, next) => {
  let txPromise;
  const userId = req.user.d.id;

  return txPromise = knex.transaction((tx) => {
    Promise.all([
      tx('user_emotes').where('user_id', userId).andWhere('emote_id', CosmeticsLookup.Emote.OtherSnowChaserHoliday2015).delete(),
      tx('user_rewards').where('user_id', userId).andWhere('source_id', GiftCrateLookup.WinterHoliday2015).delete(),
      tx('user_gift_crates').where('user_id', userId).andWhere('crate_type', GiftCrateLookup.WinterHoliday2015).delete(),
    ])
      .then(() => GiftCrateModule.addGiftCrateToUser(txPromise, tx, userId, GiftCrateLookup.WinterHoliday2015)).then(tx.commit)
      .catch(tx.rollback);
  }).then(() => res.status(200).json({}));
});

router.post('/gift_crate/lag2016', (req, res, next) => {
  let txPromise;
  const userId = req.user.d.id;

  return txPromise = knex.transaction((tx) => {
    Promise.all([
      tx('user_rewards').where('user_id', userId).andWhere('source_id', GiftCrateLookup.FebruaryLag2016).delete(),
      tx('user_gift_crates').where('user_id', userId).andWhere('crate_type', GiftCrateLookup.FebruaryLag2016).delete(),
    ])
      .then(() => GiftCrateModule.addGiftCrateToUser(txPromise, tx, userId, GiftCrateLookup.FebruaryLag2016)).then(tx.commit)
      .catch(tx.rollback);
  }).then(() => res.status(200).json({}));
});

router.post('/cosmetic_chest/:chest_type', (req, res, next) => {
  let txPromise;
  const userId = req.user.d.id;
  const chestType = req.params.chest_type;
  let hoursBack = parseInt(req.body.hours_back);

  if ((hoursBack == null)) {
    hoursBack = 0;
  }

  let bossId = null;
  let eventId = null;
  if (chestType === SDK.CosmeticsChestTypeLookup.Boss) {
    bossId = SDK.Cards.Boss.Boss3;
    eventId = `QA-${generatePushId()}`;
  }

  return txPromise = knex.transaction((tx) => CosmeticChestsModule.giveUserChest(txPromise, tx, userId, chestType, bossId, eventId, 1, 'soft', generatePushId(), moment.utc().subtract(hoursBack, 'hours'))
    .then(tx.commit)
    .catch(tx.rollback)).then(() => res.status(200).json({}));
});

router.post('/cosmetic_chest_key/:chest_type', (req, res, next) => {
  let txPromise;
  const userId = req.user.d.id;
  const chestType = req.params.chest_type;

  return txPromise = knex.transaction((tx) => CosmeticChestsModule.giveUserChestKey(txPromise, tx, userId, chestType, 1, 'soft', generatePushId())
    .then(tx.commit)
    .catch(tx.rollback)).then(() => res.status(200).json({}));
});

router.post('/cosmetic/:cosmetic_id', (req, res, next) => {
  let txPromise;
  const userId = req.user.d.id;
  const {
    cosmetic_id,
  } = req.params;

  return txPromise = knex.transaction((tx) => InventoryModule.giveUserCosmeticId(txPromise, tx, userId, cosmetic_id, 'soft', generatePushId())
    .then(tx.commit)
    .catch(tx.rollback)).then(() => res.status(200).json({}));
});

router.post('/referrals/events', (req, res, next) => {
  const userId = req.user.d.id;

  const eventType = req.body.event_type;
  return knex('users').where('id', userId).first('referred_by_user_id')
    .then((userRow) => ReferralsModule.processReferralEventForUser(userId, userRow.referred_by_user_id, eventType))
    .then(() => res.status(200).json({}))
    .catch((err) => next(err));
});

router.post('/referrals/mark', (req, res, next) => {
  const userId = req.user.d.id;
  const {
    username,
  } = req.body;
  return knex('users').where('username', username).first('id')
    .then((userRow) => ReferralsModule.markUserAsReferredByFriend(userId, userRow.id))
    .then(() => res.status(200).json({}))
    .catch((err) => next(err));
});

router.put('/account/reset', (req, res, next) => {
  const userId = req.user.d.id;

  return SyncModule.wipeUserData(userId)
    .then(() => res.status(200).json({})).catch((err) => next(err));
});

router.post('/daily_challenge', (req, res, next) => {
  Logger.module('QA').log('Pushing Daily challenge');
  const challengeName = req.body.challenge_name;
  const challengeDescription = req.body.challenge_description;
  const challengeDifficulty = req.body.challenge_difficulty;
  const challengeGold = 5;
  const challengeJSON = req.body.challenge_json;
  const challengeDate = req.body.challenge_date;
  const challengeInstructions = req.body.challenge_instructions;
  const challengeHint = req.body.challenge_hint;

  Promise.promisifyAll(zlib);

  return zlib.gzipAsync(challengeJSON)
    .bind({})
    .then(function (gzipGameSessionData) {
      this.gzipGameSessionData = gzipGameSessionData;

      let env = null;

      if (UtilsEnv.getIsInLocal()) {
        env = 'local';
      } else if (UtilsEnv.getIsInStaging()) {
        env = 'staging';
      } else {
        return Promise.reject(new Error('Unknown/Invalid ENV for storing Daily Challenge'));
      }

      const bucket = 'duelyst-challenges';

      const filename = `${env}/${challengeDate}.json`;
      this.url = `https://s3-us-west-2.amazonaws.com/${bucket}/${filename}`;

      Logger.module('QA').log(`Pushing Daily challenge with url ${this.url}`);

      const params = {
        Bucket: bucket,
        Key: filename,
        Body: this.gzipGameSessionData,
        ACL: 'public-read',
        ContentEncoding: 'gzip',
        ContentType: 'text/json',
      };

      return s3.putObjectAsync(params);
    }).then(() => DuelystFirebase.connect().getRootRef())
    .then(function (fbRootRef) {
      return FirebasePromises.set(fbRootRef.child('daily-challenges').child(challengeDate), {
        title:	challengeName,
        description:	challengeDescription,
        gold:	challengeGold,
        difficulty:	challengeDifficulty,
        instructions: challengeInstructions,
        url:	this.url,
        challenge_id: generatePushId(),
        hint:	challengeHint,
      });
    })
    .then(() => {
      Logger.module('QA').log('Success Pushing Daily challenge');
      return res.status(200).json({});
    })
    .catch((error) => {
      Logger.module('QA').log(`Failed Pushing Daily challenge\n ${error.toString()}`);
      return res.status(403).json({ message: error.toString() });
    });
});

router.post('/daily_challenge/completed_at', (req, res, next) => {
  const user_id = req.user.d.id;
  const completedAtTime = req.body.completed_at;

  let lastCompletedData = {
    daily_challenge_last_completed_at: completedAtTime,
  };

  return Promise.all([
    knex('users').where('id', user_id).update(lastCompletedData),
    knex('user_daily_challenges_completed').where('user_id', user_id).delete(),
  ]).then(() => {
    lastCompletedData = DataAccessHelpers.restifyData(lastCompletedData);
    return res.status(200).json(lastCompletedData);
  }).catch((error) => {
    Logger.module('QA').log(`Failed updating daily challenge completed at\n ${error.toString()}`);
    return res.status(403).json({ message: error.toString() });
  });
});

router.post('/daily_challenge/passed_qa', (req, res, next) => {
  const dateKey = req.body.date_key;

  return DuelystFirebase.connect().getRootRef()
    .then(function (fbRootRef) {
      this.fbRootRef = fbRootRef;
      return FirebasePromises.update(this.fbRootRef.child('daily-challenges').child(dateKey), {
        isQAReady: true,
      });
    }).then(() => res.status(200).json({}))
    .catch((error) => {
      Logger.module('QA').log(`Failed marking daily challenge as passing QA\n ${error.toString()}`);
      return res.status(403).json({ message: error.toString() });
    });
});

// Updates the users current s rank rating
router.delete('/user_progression/last_crate_awarded_at', (req, res, next) => {
  const user_id = req.user.d.id;
  return knex('user_progression').where('user_id', user_id).update({
    last_crate_awarded_at: null,
    last_crate_awarded_game_count: null,
    last_crate_awarded_win_count: null,
  }).then(() => res.status(200).json({}));
});

// Resets data for an achievement then marks it as complete
router.post('/achievement/reset_and_complete', (req, res, next) => {
  const user_id = req.user.d.id;
  const {
    achievement_id,
  } = req.body;

  return knex('user_achievements').where('user_id', user_id).andWhere('achievement_id', achievement_id).delete()
    .then(() => {
      const sdkAchievement = SDK.AchievementsFactory.achievementForIdentifier(achievement_id);

      if (sdkAchievement === null) {
        return Promise.reject(`No such achievement with id: ${achievement_id}`);
      }

      const achProgressMap = {};
      achProgressMap[achievement_id] = sdkAchievement.progressRequired;

      return AchievementsModule._applyAchievementProgressMapToUser(user_id, achProgressMap);
    })
    .then(() => {
      Logger.module('QA').log(`Completed resetting and completing achievement ${achievement_id}`);
      return res.status(200).json({});
    })
    .catch((error) => {
      Logger.module('QA').log(`Failed resetting and completing achievement\n ${error.toString()}`);
      return res.status(403).json({ message: error.toString() });
    });
});

router.post('/migration/prismatic_backfill', (req, res, next) => {
  const user_id = req.user.d.id;
  let numOrbs = req.body.num_orbs;
  numOrbs = parseInt(numOrbs);

  return knex('users').where('id', user_id).update({
    last_session_version: '1.72.0',
  }).bind({})
    .then(() => {
      const timeBeforePrismaticFeatureAddedMoment = moment.utc('2016-07-20 20:00');

      return Promise.each(__range__(1, numOrbs, true), (index) => knex('user_spirit_orbs_opened').insert({
        id: generatePushId(),
        user_id,
        card_set: SDK.CardSet.Core,
        transaction_type: 'soft',
        created_at: timeBeforePrismaticFeatureAddedMoment.toDate(),
        opened_at: timeBeforePrismaticFeatureAddedMoment.toDate(),
        cards: [1, 1, 1, 1, 1],
      }));
    })
    .then(() => {
      Logger.module('QA').log('Completed setting up prismatic backfill');
      return res.status(200).json({});
    });
});

router.delete('/boss_event', (req, res, next) => {
  const bossEventId = 'QA-Boss-Event';

  return DuelystFirebase.connect().getRootRef()
    .then((fbRootRef) => FirebasePromises.remove(fbRootRef.child('boss-events').child(bossEventId))).then(() => {
      Logger.module('QA').log('Completed setting up qa boss event');
      return res.status(200).json({});
    });
});

router.delete('/boss_event/rewards', (req, res, next) => {
  const user_id = req.user.d.id;

  return Promise.all([
    knex('user_bosses_defeated').where('user_id', user_id).delete(),
    knex('user_cosmetic_chests').where('user_id', user_id).andWhere('chest_type', SDK.CosmeticsChestTypeLookup.Boss).delete(),
    knex('user_cosmetic_chests_opened').where('user_id', user_id).andWhere('chest_type', SDK.CosmeticsChestTypeLookup.Boss).delete(),
  ]).then(() => SyncModule._syncUserFromSQLToFirebase(user_id)).then(() => {
    Logger.module('QA').log('Completed removing user\'s boss rewards');
    return res.status(200).json({});
  });
});

router.put('/boss_event', (req, res, next) => {
  const adjustedMs = req.body.adjusted_ms;
  const bossId = parseInt(req.body.boss_id);

  const eventStartMoment = moment.utc().add(adjustedMs, 'milliseconds');

  const bossEventId = 'QA-Boss-Event';
  const bossEventData = {
    event_id: bossEventId,
    boss_id: bossId,
    event_start: eventStartMoment.valueOf(),
    event_end: eventStartMoment.clone().add(1, 'week').valueOf(),
    valid_end: eventStartMoment.clone().add(1, 'week').add(1, 'hour').valueOf(),
  };

  return DuelystFirebase.connect().getRootRef()
    .bind({})
    .then(function (fbRootRef) {
      this.fbRootRef = fbRootRef;
      return FirebasePromises.remove(this.fbRootRef.child('boss-events').child(bossEventId));
    })
    .then(function () {
      return FirebasePromises.set(this.fbRootRef.child('boss-events').child(bossEventId), bossEventData);
    })
    .then(() => {
      Logger.module('QA').log('Completed setting up qa boss event');
      return res.status(200).json({});
    });
});

router.put('/rift/duplicates', (req, res, next) => {
  const user_id = req.user.d.id;

  return knex('user_rift_runs').select().where('user_id', user_id)
    .then((riftRuns) => Promise.each(riftRuns, (riftRun) => {
      if (riftRun.card_choices != null) {
        return knex('user_rift_runs').where('ticket_id', riftRun.ticket_id).update({
          card_choices: [11088, 20076, 11087, 11087, 20209, 11052],
        });
      }
      return Promise.resolve();
    }))
    .then(() => res.status(200).json({}));
});

// router.put '/premium_currency/amount', (req, res, next) ->
// 	user_id = req.user.d.id
// 	amount = parseInt(req.body.amount)

// 	amountPromise = null

// 	txPromise = knex.transaction (tx)->
// 		if (amount < 0)
// 			return ShopModule.debitUserPremiumCurrency(txPromise,tx,user_id,amount,generatePushId(),"qa tool gift")
// 		else
// 			return ShopModule.creditUserPremiumCurrency(txPromise,tx,user_id,amount,generatePushId(),"qa tool gift")
// 	.then ()->
// 		res.status(200).json({})

router.get('/shop/charge_log', (req, res, next) => {
  const user_id = req.user.d.id;

  return knex('user_charges').select().where('user_id', user_id)
    .then((userChargeRows) => res.status(200).json({ userChargeRows }));
});

module.exports = router;

function __range__(left, right, inclusive) {
  const range = [];
  const ascending = left < right;
  const end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
