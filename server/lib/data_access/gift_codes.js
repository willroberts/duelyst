/* eslint-disable
    camelcase,
    func-names,
    import/extensions,
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-restricted-syntax,
    no-return-assign,
    no-underscore-dangle,
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
const Promise = require('bluebird');
const util = require('util');
const colors = require('colors');
const moment = require('moment');
const _ = require('underscore');
const FirebasePromises = require('../firebase_promises');
const DuelystFirebase = require('../duelyst_firebase_module');
const Logger = require('../../../app/common/logger.coffee');
const SyncModule = require('./sync');
const InventoryModule = require('./inventory');
const CosmeticChestsModule = require('./cosmetic_chests');
const Errors = require('../custom_errors');
const mail = require('../../mailer');
const knex = require('./knex');
const config = require('../../../config/config.js');
const generatePushId = require('../../../app/common/generate_push_id');

Promise.promisifyAll(mail);

const SDK = require('../../../app/sdk');

class GiftCodesModule {
  static redeemGiftCode(userId, giftCode, systemTime) {
    let txPromise;
    const MOMENT_NOW_UTC = systemTime || moment().utc();

    // userId must be defined
    if (!userId) {
      return Promise.reject(new Error(`Can not claim gift code: invalid user ID - ${userId}`));
    }

    // userId must be defined
    if (!giftCode) {
      return Promise.reject(new Error(`Can not claim gift code: invalid code - ${giftCode}`));
    }

    const this_obj = {};

    return txPromise = knex.transaction((tx) => {
      Promise.all([
        tx('users').first('id', 'created_at').where('id', userId).forUpdate(),
        tx('gift_codes').first().where('code', giftCode).forUpdate(),
        tx('user_progression').first('game_count').where('user_id', userId),
      ])
        .bind(this_obj)
        .spread(function (userRow, giftCodeRow, progressionRow) {
          this.giftCodeRow = giftCodeRow;
          this.userRow = userRow;
          this.progressionRow = progressionRow;

          if ((userRow == null)) {
            throw new Errors.NotFoundError('User Not Found');
          }

          if ((giftCodeRow == null)) {
            throw new Errors.NotFoundError('Gift Code Note Found');
          }

          if (giftCodeRow.claimed_at != null) {
            throw new Errors.BadRequestError('This Gift Code has already been claimed.');
          }

          if ((giftCodeRow.valid_for_users_created_after != null) && moment.utc(userRow.created_at).isBefore(moment.utc(giftCodeRow.valid_for_users_created_after))) {
            throw new Errors.BadRequestError('This Gift Code can not be claimed by this account.');
          }

          if ((giftCodeRow.expires_at != null) && moment.utc().isAfter(moment.utc(giftCodeRow.expires_at))) {
            throw new Errors.BadRequestError('This Gift Code has expired.');
          }

          if ((giftCodeRow.game_count_limit != null) && (progressionRow.game_count > giftCodeRow.game_count_limit)) {
            throw new Errors.BadRequestError(`This Gift Code can not be applied to an accont with ${progressionRow.game_count} games played.`);
          }

          let exclusionCheckPromise = Promise.resolve(null);
          if (this.giftCodeRow.exclusion_id != null) {
            exclusionCheckPromise = tx('gift_codes').first().where('claimed_by_user_id', userId).andWhere('exclusion_id', this.giftCodeRow.exclusion_id);
          }

          return exclusionCheckPromise;
        }).then(function (claimedGiftCodeWithMatchingExclusionRow) {
          let card_ids;
          if (claimedGiftCodeWithMatchingExclusionRow != null) {
            throw new Errors.BadRequestError('Gift Code of this type has already been claimed.');
          }

          const allPromises = [];

          // Kickstarter Backers $50 or below
          // 1 of every core set collectible non-prismatic card from every faction except magmar and vanar
          if (this.giftCodeRow.type === 'ks-1') {
            card_ids = _.chain(SDK.GameSession.getCardCaches().getCardSet(SDK.CardSet.Core).getIsUnlockable(false).getIsCollectible(true)
              .getIsPrismatic(false)
              .getCards())
              .filter((c) => (c.getFactionId() !== SDK.Factions.Vanar) && (c.getFactionId() !== SDK.Factions.Magmar))
              .map((c) => c.getId())
              .value();
            allPromises.push(InventoryModule.giveUserCards(txPromise, tx, userId, card_ids, 'gift code reward', this.giftCodeRow.code));
          }

          // Kickstarter Backers $60 or above
          // 1 of every core set collectible non-prismatic card
          if (this.giftCodeRow.type === 'ks-2') {
            card_ids = SDK.GameSession.getCardCaches().getCardSet(SDK.CardSet.Core).getIsUnlockable(false).getIsCollectible(true)
              .getIsPrismatic(false)
              .getCardIds();
            allPromises.push(InventoryModule.giveUserCards(txPromise, tx, userId, card_ids, 'gift code reward', this.giftCodeRow.code));
          }

          // Currency Reward Code
          if ((this.giftCodeRow.type === 'rewards') || (this.giftCodeRow.type === 'humble')) {
            let i;
            const goldAmount = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.gold : undefined;
            const spiritAmount = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.spirit : undefined;
            const spiritOrbs = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.orbs : undefined;
            const shimzarSpiritOrbs = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.shimzar_orbs : undefined;
            const comboSpiritOrbs = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.combo_orbs : undefined;
            const unearthedSpiritOrbs = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.unearthed_orbs : undefined;
            const immortalSpiritOrbs = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.immortal_orbs : undefined;
            const mythronSpiritOrbs = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.mythron_orbs : undefined;
            const gauntletTickets = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.gauntlet_tickets : undefined;
            const cosmetics = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.cosmetics : undefined;
            const cardIds = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.card_ids : undefined;
            const crate_keys = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.crate_keys : undefined;
            const crates = this.giftCodeRow.rewards != null ? this.giftCodeRow.rewards.crates : undefined;

            if (goldAmount) {
              allPromises.push(InventoryModule.giveUserGold(txPromise, tx, userId, goldAmount, 'gift code', this.giftCodeRow.code));
            }

            if (spiritAmount) {
              allPromises.push(InventoryModule.giveUserSpirit(txPromise, tx, userId, spiritAmount, 'gift code', this.giftCodeRow.code));
            }

            if (spiritOrbs) {
              let asc; let
                end;
              for (i = 0, end = spiritOrbs, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
                allPromises.push(InventoryModule.addBoosterPackToUser(txPromise, tx, userId, SDK.CardSet.Core, 'gift code', this.giftCodeRow.code));
              }
            }

            if (shimzarSpiritOrbs) {
              let asc1; let
                end1;
              for (i = 0, end1 = shimzarSpiritOrbs, asc1 = end1 >= 0; asc1 ? i < end1 : i > end1; asc1 ? i++ : i--) {
                allPromises.push(InventoryModule.addBoosterPackToUser(txPromise, tx, userId, SDK.CardSet.Shimzar, 'gift code', this.giftCodeRow.code));
              }
            }

            if (comboSpiritOrbs) {
              let asc2; let
                end2;
              for (i = 0, end2 = comboSpiritOrbs, asc2 = end2 >= 0; asc2 ? i < end2 : i > end2; asc2 ? i++ : i--) {
                allPromises.push(InventoryModule.addBoosterPackToUser(txPromise, tx, userId, SDK.CardSet.CombinedUnlockables, 'gift code', this.giftCodeRow.code));
              }
            }

            if (unearthedSpiritOrbs) {
              let asc3; let
                end3;
              for (i = 0, end3 = unearthedSpiritOrbs, asc3 = end3 >= 0; asc3 ? i < end3 : i > end3; asc3 ? i++ : i--) {
                allPromises.push(InventoryModule.addBoosterPackToUser(txPromise, tx, userId, SDK.CardSet.FirstWatch, 'gift code', this.giftCodeRow.code));
              }
            }

            if (immortalSpiritOrbs) {
              let asc4; let
                end4;
              for (i = 0, end4 = immortalSpiritOrbs, asc4 = end4 >= 0; asc4 ? i < end4 : i > end4; asc4 ? i++ : i--) {
                allPromises.push(InventoryModule.addBoosterPackToUser(txPromise, tx, userId, SDK.CardSet.Wartech, 'gift code', this.giftCodeRow.code));
              }
            }

            if (mythronSpiritOrbs) {
              let asc5; let
                end5;
              for (i = 0, end5 = mythronSpiritOrbs, asc5 = end5 >= 0; asc5 ? i < end5 : i > end5; asc5 ? i++ : i--) {
                allPromises.push(InventoryModule.addBoosterPackToUser(txPromise, tx, userId, SDK.CardSet.Coreshatter, 'gift code', this.giftCodeRow.code));
              }
            }

            if (gauntletTickets) {
              let asc6; let
                end6;
              for (i = 0, end6 = gauntletTickets, asc6 = end6 >= 0; asc6 ? i < end6 : i > end6; asc6 ? i++ : i--) {
                allPromises.push(InventoryModule.addArenaTicketToUser(txPromise, tx, userId, 'gift code', this.giftCodeRow.code));
              }
            }

            if (cosmetics) {
              for (const cosmetic of Array.from(cosmetics)) {
                allPromises.push(InventoryModule.giveUserCosmeticId(txPromise, tx, userId, cosmetic, 'gift code', this.giftCodeRow.code));
              }
            }

            if (cardIds != null) {
              allPromises.push(InventoryModule.giveUserCards(txPromise, tx, userId, cardIds, 'gift code', this.giftCodeRow.code));
            }

            if (crates != null) {
              for (const crateType of Array.from(crates)) {
                allPromises.push(CosmeticChestsModule.giveUserChest(txPromise, tx, userId, crateType, null, null, 1, 'gift code', this.giftCodeRow.code));
              }
            }

            if (crate_keys != null) {
              for (const keyType of Array.from(crate_keys)) {
                allPromises.push(CosmeticChestsModule.giveUserChestKey(txPromise, tx, userId, keyType, 1, 'gift code', this.giftCodeRow.code));
              }
            }
          }

          allPromises.push(tx('gift_codes').where('code', giftCode).update({
            claimed_by_user_id: this.userRow.id,
            claimed_at: MOMENT_NOW_UTC.toDate(),
          }));

          return Promise.all(allPromises);
        })
        .then(() => SyncModule._bumpUserTransactionCounter(tx, userId))
        .then(tx.commit)
        .catch(tx.rollback);
    }).bind(this_obj)
      .then(function () {
        Logger.module('GiftCodesModule').debug(`redeemGiftCode() -> user ${userId.blue} `.green + ` reedemed code ${giftCode}`.green);
        return Promise.resolve(this.giftCodeRow);
      });
  }
}

module.exports = GiftCodesModule;
