/* eslint-disable
    camelcase,
    consistent-return,
    func-names,
    import/extensions,
    import/no-unresolved,
    max-len,
    no-tabs,
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
const colors = require('colors');
const t = require('tcomb-validation');
const zlib = require('zlib');
const Promise = require('bluebird');
const moment = require('moment');
const AWS = require('aws-sdk');
const knex = require('../../../lib/data_access/knex');
const InventoryModule = require('../../../lib/data_access/inventory');
const GauntletModule = require('../../../lib/data_access/gauntlet');
const RiftModule = require('../../../lib/data_access/rift');
const Logger = require('../../../../app/common/logger.coffee');
const config 	= require('../../../../config/config.js');
const Errors = require('../../../lib/custom_errors');
const validators = require('../../../validators');
const hashHelpers = require('../../../lib/hash_helpers.coffee');
const validatorTypes = require('../../../validators/types');

// promisify
Promise.promisifyAll(zlib);

const router = express.Router();

router.delete('/card_collection', (req, res, next) => {
  const result = t.validate(req.body.card_ids, t.list(t.Number));
  if (!result.isValid()) {
    return res.status(400).json(result.errors);
  }

  const user_id = req.user.d.id;
  const card_ids = result.value;

  Logger.module('API').debug(`Disenchanting cards ${util.inspect(card_ids)} for user ${user_id.blue}`.magenta);
  return InventoryModule.disenchantCards(user_id, card_ids)
    .then((rewardsData) => {
      Logger.module('API').debug(`Disenchanted cards for user ${user_id.blue}`.cyan);
      return res.status(200).json(rewardsData);
    }).catch((error) => {
      Logger.module('API').error(`ERROR Disenchanting cards for user ${user_id.blue}`.red, util.inspect(error));
      return next(error);
    });
});

router.delete('/card_collection/duplicates', (req, res, next) => {
  const user_id = req.user.d.id;

  Logger.module('API').debug(`Disenchanting duplicate cards for user ${user_id.blue}`.magenta);
  return InventoryModule.disenchantDuplicateCards(user_id)
    .then((rewardsData) => {
      Logger.module('API').debug(`Disenchanted cards for user ${user_id.blue}`.cyan);
      return res.status(200).json(rewardsData);
    }).catch((error) => {
      Logger.module('API').error(`ERROR Disenchanting cards for user ${user_id.blue}`.red, util.inspect(error));
      return next(error);
    });
});

router.post('/card_collection/:card_id', (req, res, next) => {
  const result = t.validate(parseInt(req.params.card_id, 10), t.Number);
  if (!result.isValid()) {
    return next();
  }

  const user_id = req.user.d.id;
  const card_id = result.value;

  Logger.module('API').debug(`Crafting card ${card_id} for user ${user_id.blue}`.magenta);
  return InventoryModule.craftCard(user_id, card_id)
    .then((data) => {
      Logger.module('API').debug(`Crafted card ${card_id} for user ${user_id.blue}`.cyan);
      return res.status(200).json(data);
    }).catch(Errors.InsufficientFundsError, (error) => res.status(403).json({})).catch((error) => {
      Logger.module('API').error(`ERROR crafting card for user ${user_id.blue}`.red, util.inspect(error));
      return next(error);
    });
});

router.put('/card_collection/:card_id/read_at', (req, res, next) => {
  const result = t.validate(parseInt(req.params.card_id, 10), t.Number);
  if (!result.isValid()) {
    return next();
  }

  const user_id = req.user.d.id;
  const card_id = result.value;

  // don't wait for completion
  InventoryModule.markCardAsReadInUserCollection(user_id, card_id);

  Logger.module('API').debug(`Marked card ${card_id} as read for user ${user_id.blue}`.cyan);
  return res.status(200).json({});
});

router.put('/card_collection/read_all', (req, res, next) => {
  const user_id = req.user.d.id;

  // don't wait for completion
  InventoryModule.markAllCardsAsReadInUserCollection(user_id);

  Logger.module('API').debug(`Marked all cards as read for user ${user_id.blue}`.cyan);
  return res.status(200).json({});
});

router.put('/card_lore_collection/:card_id/read_lore_at', (req, res, next) => {
  const result = t.validate(parseInt(req.params.card_id, 10), t.Number);
  if (!result.isValid()) {
    return next();
  }

  const user_id = req.user.d.id;
  const card_id = result.value;

  // don't wait for completion
  InventoryModule.markCardLoreAsReadInUserCollection(user_id, card_id);

  Logger.module('API').debug(`Marked card ${card_id} lore as read for user ${user_id.blue}`.cyan);
  return res.status(200).json({});
});

router.post('/spirit_orbs', (req, res, next) => {
  const user_id = req.user.d.id;
  const {
    qty,
  } = req.body;
  const {
    card_set_id,
  } = req.body;
  const {
    currency_type,
  } = req.body;

  Logger.module('API').debug(`Buying ${qty} Booster Packs for user ${user_id.blue} from set ${card_set_id}`.magenta);

  if (currency_type === 'soft') {
    Logger.module('API').debug(`Buying Booster Packs for user ${user_id.blue} with GOLD`);
    return InventoryModule.buyBoosterPacksWithGold(user_id, qty, card_set_id)
      .then((value) => {
        Logger.module('API').debug(`COMPLETE Buying Booster Pack with GOLD for user ${user_id.blue}`.cyan);
        return res.status(200).json(value);
      }).catch(Errors.InsufficientFundsError, (error) => {
        Logger.module('API').error(`INSUFFICIENT FUNDS Buying Booster Pack with GOLD for user ${user_id.blue}`.red);
        return res.status(403).json({});
      }).catch((error) => {
        Logger.module('API').error(`ERROR Buying Booster Pack with GOLD for user ${user_id.blue}`.red);
        return next(error);
      });
  } if (currency_type === 'hard') {
    return res.status(400).json({ message: 'Hard purchases no longer supported.' });
  }
});

router.put('/spirit_orbs/opened/:booster_pack_id', (req, res, next) => {
  const result = t.validate(req.params.booster_pack_id, t.subtype(t.Str, (s) => s.length === 20));
  if (!result.isValid()) {
    return res.status(400).json(result.errors);
  }

  const user_id = req.user.d.id;
  const pack_id = result.value;

  Logger.module('API').debug(`Unlocking Booster Pack ${pack_id} for user ${user_id.blue}`.magenta);
  return InventoryModule.unlockBoosterPack(user_id, pack_id)
    .then((value) => {
      Logger.module('API').debug(`UNLOCKED Booster Pack ${pack_id} for user ${user_id.blue}`.cyan);
      return res.status(200).json(value);
    }).catch((error) => {
      Logger.module('API').error(`ERROR Unlocking Booster Pack for user ${user_id.blue}`.red);
      return next(error);
    });
});

router.post('/gauntlet_tickets', (req, res, next) => {
  const user_id = req.user.d.id;

  return GauntletModule.buyArenaTicketWithGold(user_id)
    .then((data) => {
      Logger.module('API').debug(`Arena ticket PURCHASED for user ${user_id.blue}`.cyan);
      return res.status(200).json(data);
    }).catch(Errors.InsufficientFundsError, (error) => res.status(401).json({ message: 'Insufficient gold to buy a Gauntlet ticket.' })).catch((error) => {
      Logger.module('API').error(`ERROR buying arena ticket for user ${user_id.blue}`.red, util.inspect(error));
      return next(error);
    });
});

router.post('/rift_tickets', (req, res, next) => {
  const user_id = req.user.d.id;

  return RiftModule.buyRiftTicketWithGold(user_id)
    .then((ticketId) => {
      Logger.module('API').log(`Rift ticket ${ticketId} PURCHASED for user ${user_id.blue}`.cyan);
      return res.status(200).json({ id: ticketId });
    }).catch(Errors.InsufficientFundsError, (error) => res.status(401).json({ message: 'Insufficient gold to buy a Rift ticket.' })).catch((error) => {
      Logger.module('API').error(`ERROR buying rift ticket for user ${user_id.blue}`.red, util.inspect(error));
      return next(error);
    });
});

router.post('/codex/missing', (req, res, next) => {
  const user_id = req.user.d.id;

  return InventoryModule.giveUserMissingCodexChapters(user_id)
    .then((acquiredCodexChapterIds) => res.status(200).json(acquiredCodexChapterIds)).catch((error) => next(error));
});

router.post('/card_collection/soft_wipe', (req, res, next) => {
  const user_id = req.user.d.id;
  const {
    password,
  } = req.body;

  Logger.module('API').debug(`${user_id} requesting inventory soft wipe`);

  const passwordValidationResult = t.validate(password, validatorTypes.Password);
  if (!passwordValidationResult.isValid()) {
    return res.status(400).json(passwordValidationResult.errors);
  }

  return knex('users').where('id', user_id).first('password')
    .bind({})
    .then((userRow) => hashHelpers.comparePassword(password, userRow.password))
    .then((match) => {
      if (!match) {
        throw new Errors.BadPasswordError();
      }
      return Promise.all([
        knex('user_cards').where('user_id', user_id).select(),
        knex('user_card_log').where('user_id', user_id).select(),
        knex('user_card_collection').where('user_id', user_id).first(),
        knex('user_spirit_orbs_opened').where('user_id', user_id).select(),
      ]);
    })
    .spread((cardCountRows, cardLogRows, cardCollectionRow, spiritOrbOpenedRows) => {
      const backup = {
        user_cards: cardCountRows,
        user_card_log: cardLogRows,
        user_card_collection: cardCollectionRow,
        user_spirit_orbs_opened: spiritOrbOpenedRows,
      };

      return zlib.gzipAsync(JSON.stringify(backup));
    })
    .then(function (backupDataZipped) {
      this.backupDataZipped = backupDataZipped;
      return InventoryModule.softWipeUserCardInventory(user_id);
    })
    .then(function () {
      // configure aws
      AWS.config.update({
        accessKeyId: config.get('s3_user_backup_snapshots.key'),
        secretAccessKey: config.get('s3_user_backup_snapshots.secret'),
      });

      // create a S3 API client
      const s3 = new AWS.S3();
      // promisify s3
      Promise.promisifyAll(s3);

      // ...
      const bucket = config.get('s3_user_backup_snapshots.bucket');
      const filename = `${config.get('env')}/${user_id}/${moment().utc().format('YYYY-MM-DD')}.json`;

      // ...
      const params = {
        Bucket: bucket,
        Key: filename,
        Body: this.backupDataZipped,
        // ACL: 'public-read'
        ContentEncoding: 'gzip',
        ContentType: 'text/json',
      };

      // upload backup and catch any errors silently
      s3.putObjectAsync(params)
        .then(() => Logger.module('API').debug(`Back up SUCCESS for ${user_id} inventory before wipe.`)).catch((e) => Logger.module('API').error(`ERROR backing up ${user_id} before inventory soft wipe: ${e.message}`));

      // respond and return
      res.status(200).json({});
      return Promise.resolve();
    })
    .catch(Errors.BadPasswordError, (e) => res.status(401).json({ message: 'invalid password' }))
    .catch(Errors.BadRequestError, (e) => res.status(400).json({ message: e.message }))
    .catch((error) => next(error));
});

// Crafting a cosmetic
router.post('/cosmetics/:cosmetic_id', (req, res, next) => {
  const result = t.validate(parseInt(req.params.cosmetic_id, 10), t.Number);
  if (!result.isValid()) {
    return next();
  }

  const user_id = req.user.d.id;
  const cosmetic_id = result.value;

  Logger.module('API').debug(`Crafting cosmetic ${cosmetic_id} for user ${user_id.blue}`.magenta);
  return InventoryModule.craftCosmetic(user_id, cosmetic_id)
    .then((data) => {
      Logger.module('API').debug(`Crafted cosmetic ${cosmetic_id} for user ${user_id.blue}`.cyan);
      return res.status(200).json(data);
    }).catch(Errors.InsufficientFundsError, (error) => res.status(403).json({ message: 'Insufficient Spirit' })).catch((error) => {
      Logger.module('API').error(`ERROR crafting cosmetic for user ${user_id.blue}`.red, util.inspect(error));
      return next(error);
    });
});

router.post('/free_card_of_the_day', (req, res, next) => {
  const user_id = req.user.d.id;
  Logger.module('API').debug(`Claiming free card of the day for user ${user_id.blue}`.magenta);
  return InventoryModule.claimFreeCardOfTheDay(user_id)
    .then((cardId) => res.status(200).json({ card_id: cardId })).catch((error) => {
      Logger.module('API').error(`ERROR claiming free card of the day for user ${user_id.blue}`.red, util.inspect(error));
      return next(error);
    });
});

module.exports = router;
