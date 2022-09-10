/* eslint-disable
    camelcase,
    consistent-return,
    func-names,
    import/extensions,
    import/no-extraneous-dependencies,
    import/no-unresolved,
    import/order,
    max-len,
    no-console,
    no-param-reassign,
    no-return-assign,
    no-tabs,
    no-underscore-dangle,
    no-unreachable,
    no-use-before-define,
    no-var,
    vars-on-top,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

/*

	give_all_gold_arena_ticket - Gives all current users gold / arena ticket

	Examples:
 	give_all_gold_arena_ticket # does a dry run to see what the results will be
 	give_all_gold_arena_ticket commit # ...

*/

// region Requires
// Configuration object
// config = require("../../config/config.js")
const config = require('../../../config/config.js');
const Firebase = require('firebase');
const _ = require('underscore');

const fbRef = new Firebase(config.get('firebase'));
const moment = require('moment');
const Promise = require('bluebird');
const ProgressBar = require('progress');
const colors = require('colors');
const fs = require('fs');
const knex = require('../../../server/lib/data_access/knex');
const Logger = require('../../../app/common/logger.coffee');

// Firebase secure token for duelyst-dev.firebaseio.com
Logger.module('Script').log('loading modules...');
const GiftCrateModule = require('../../../server/lib/data_access/gift_crate.coffee');
const GiftCrateLookup = require('../../../app/sdk/giftCrates/giftCrateLookup.coffee');

Logger.module('Script').log('loading modules... DONE');
// endregion Requires

Logger.enabled = false;
let scriptId = 'feb-2016-server-lag-gift-crate3';
const resultsLogFile = fs.createWriteStream(`${__dirname}/${scriptId}.${moment.utc().valueOf()}.log.txt`);
const storeResults = true;
const results = {
  numUsers: 0,
  numUsersProcessed: 0,
  knownToHaveSucceeded: [],
};
let batchIndex = 0;
const batchSize = 20;

let bar = null;
let dryRun = true;

const give_all_gold_arena_ticket = function () {
  if (dryRun) {
    scriptId = `${scriptId}-dry`;
  }

  Logger.module('Script').log('STARTING');

  bar = new ProgressBar('Giving rewards [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 40,
    total: 1, // Filled in later
  });

  return knex('script_run_records').where('id', scriptId).first()
    .then((scriptRecordRow) => {
      if (!scriptRecordRow) {
        Logger.module('Script').log('creating script record row in DB');
        return knex('script_run_records').insert({
          id: scriptId,
        });
      } if (scriptRecordRow.is_complete) {
        throw new Error('Looks like this script is marked as COMPLETE');
      } else {
        batchIndex = scriptRecordRow.last_batch_processed;
        return results.knownToHaveSucceeded = scriptRecordRow.succeeded_in_batch || [];
      }
    })

    .then(() => {
      Logger.module('Script').log(`Counting records left starting at batch ${batchIndex}`);

      return knex('users')
        .count('id')
        .then((results) => results[0].count);
    })
    .then((userCount) => {
      const startOffset = batchIndex * batchSize;
      userCount -= startOffset;

      Logger.module('Script').log(`Records Left to Process: ${userCount}\n`);

      const numUsers = userCount;
      bar.total = numUsers;
      return results.numUsers = numUsers;
    })
    .then(() => _processNextSetOfUsers(batchIndex));
};

var _processNextSetOfUsers = function (batchIndex) {
  const startOffset = batchIndex * batchSize;
  Logger.module('Script').log(`Processing BATCH ${batchIndex} ... ${startOffset} to ${startOffset + batchSize}`.yellow);

  return knex('users')
    .select('id')
    .orderBy('id', 'asc')
    .offset(startOffset)
    .limit(batchSize)
    .bind({})
    .then(function (users) {
      Logger.module('Script').log(`Processing BATCH ${batchIndex}. count: ${users.length}`);
      const numUsers = users.length;

      this.succeededInBatch = [];
      this.errors = [];

      // detect completion
      if (numUsers === 0) {
        Logger.module('Script').log('Found ZERO in Batch. Marking self as DONE.');
        return Promise.resolve(false);
      }

      return Promise.map(
        users,
        (userData) => {
          const userId = userData.id;

          if (_.contains(results.knownToHaveSucceeded, userId)) {
            Logger.module('Script').debug(`SKIPPING already processed user ${userId.green}`);
            this.succeededInBatch.push(userId);
            return Promise.resolve();
          }
          return Promise.resolve()
            .bind(this)
            .then(() => {
              if (dryRun) {
                if (Math.random() > 0.995) {
                  Logger.module('Script').debug(`Errored at ${userId.red}`);
                  throw new Error('RANDOM ERROR!');
                }
                return knex('users').first().where('id', userId);
              }
              var txPromise = knex.transaction((tx) => {
                tx('users').first('id').where('id', userId).forUpdate()
                  .then((userRow) => GiftCrateModule.addGiftCrateToUser(txPromise, tx, userId, GiftCrateLookup.FebruaryLag2016))
                  .then(tx.commit)
                  .catch(tx.rollback);
              });
              return txPromise;
            }).then(function () {
              resultsLogFile.write(`${userId}\n`);
              Logger.module('Script').debug(`processed ${userId.blue}`);
              results.numUsersProcessed += 1;
              this.succeededInBatch.push(userId);
              if (!dryRun) {
                return bar.tick();
              }
            })
            .catch(function (e) {
              this.errors.push(e);
              return console.error(`ERROR on user ${userId}: ${e.message}.`.red);
            });
        },

        { concurrency: 8 },
      );
    })
    .catch(function (e) {
      return this.errors.push(e);
    })
    .then(function (needsMoreProcessing) {
      if ((this.succeededInBatch.length !== batchSize) || (this.errors.length > 0)) {
        if (this.errors.length > 0) {
          console.error(`ERROR: ${this.errors[0].message}. Processed ${results.numUsersProcessed}/${results.numUsers}. Stopped at Batch: ${batchIndex} (starting at ${batchIndex * batchSize})`);
        }
      }

      this.needsMoreProcessing = needsMoreProcessing;

      Logger.module('Script').debug('Updating Script Run Record');

      let complete = !this.needsMoreProcessing;
      let listSucceeded = null;
      if (this.errors.length > 0) {
        complete = false;
        listSucceeded = this.succeededInBatch;
      }

      return knex('script_run_records').where('id', scriptId).update({
        last_batch_processed: batchIndex,
        updated_at: moment().utc().toDate(),
        succeeded_in_batch: listSucceeded,
        is_complete: complete,
      });
    })
    .then(function () {
      if (this.errors.length > 0) {
        console.error(`ERROR count ${this.errors.length}`);
        console.error(this.errors);
        resultsLogFile.end();
        throw new Error('ABORTING');
      }

      if (this.needsMoreProcessing) {
        batchIndex += 1;
        return _processNextSetOfUsers(batchIndex);
      }
      resultsLogFile.end();
      return Promise.resolve();
    });
};

// Check usage, either must have 2 args (coffee and script name) or third parameter must be commit
if ((process.argv.length > 3) || ((process.argv[2] !== undefined) && (process.argv[2] !== 'commit'))) {
  console.log('Unexpected usage.');
  console.log(`Given: ${process.argv}`);
  console.log('Expected: coffee give_allUsers_winter_2015_crate {commit}\'');
  throw new Error('Invalid usage');
  process.exit(1);
}

// check whether a dry run
if (process.argv[2] === 'commit') {
  dryRun = false;
  Logger.enabled = false;
} else {
  dryRun = true;
  Logger.enabled = true;
  console.log('---------------------------------------------------------------------');
  console.log('Performing dry run, no changes will be made to user data');
  console.log('Run give_all_gold_arena_ticket with \'commit\' to perform changes');
  console.log('---------------------------------------------------------------------');
}

// Begin script execution
// console.log process.argv

give_all_gold_arena_ticket()
  .then(() => {
    Logger.module('Script').log(('give_all_gold_arena_ticket() -> completed\n').blue);
    if (dryRun) {
      console.log('---------------------------------------------------------------------');
      console.log('Completed dry run, no changes were made to user data');
      console.log('---------------------------------------------------------------------');
    }
    console.dir(results);
    return process.exit(1);
  });

module.exports = give_all_gold_arena_ticket;
