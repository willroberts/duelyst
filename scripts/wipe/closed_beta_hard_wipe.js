/* eslint-disable
    camelcase,
    consistent-return,
    func-names,
    import/extensions,
    import/no-unresolved,
    import/order,
    max-len,
    no-console,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

/*

	closed_beta_hard_wipe - Wipes all users inventories and gives them gold based on current gold + 100g per booster pack

	Examples: (no parameters required)
  * Does nothing
  closed_beta_hard_wipe
  * Actually wipe the data
  closed_beta_hard_wipe commit_wipe

*/

// region Requires
// Configuration object
const config = require('../../config/config.js');
const Promise = require('bluebird');
const Firebase = require('firebase');
const _ = require('underscore');

const fbRef = new Firebase(config.get('firebase'));
const moment = require('moment');
const Logger = require('../../app/common/logger.coffee');

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get('firebaseToken');
const UsersModule = require('../../server/lib/users_module');
const DuelystFirebase = require('../../server/lib/duelyst_firebase_module');
const FirebasePromises = require('../../server/lib/firebase_promises.coffee');
// endregion Requires

// Resolves to a results object filled with data representing the results of the wipe
const closed_beta_hard_wipe = function () {
  const results = {};

  return DuelystFirebase.connect().getRootRef()
    .bind({})
    .then(function (fbRootRef) {
      this.fbRootRef = fbRootRef;
      const treeRemovalPromises = [];

      Logger.module('Script').log(('closed_beta_hard_wipe() -> Beginning to wipe trees').green);

      //		treeRemovalPromises.push(FirebasePromises.remove(@fbRootRef.child('games-data'))) // too big error
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-aggregates')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-arena-run')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-challenge-progression')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-decks')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-faction-progression')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-games')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-inventory')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-logs')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-matchmaking-errors')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-new-player-progression')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-news')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-progression')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-quests')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-ranking')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-rewards')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-stats')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-transactions')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('job-queues')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('matchmaking')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('news')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('telemetry')));
      treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('transactions-in-progress')));

      return Promise.all(treeRemovalPromises);
    })
    .then(function () {
      // Next we need to give all users currently registered 1000 gold
      // Retrieves the most recently registered user so we know when we've given all users reward
      const {
        fbRootRef,
      } = this;
      return new Promise((resolve, reject) => {
        const usersRef = fbRootRef.child('users');
        return usersRef.orderByChild('createdAt').limitToLast(1).on('child_added', (snapshot) => {
          Logger.module('Script').log((`closed_beta_hard_wipe() -> Most recently registered user id is: ${snapshot.key()}`).green);
          return resolve(snapshot.key());
        });
      });
    })
    .then(function (mostRecentRegistrationKey) {
      // Go through each user and initialize their wallet and give them 1000 gold, ending when the last user is processed
      const usersRef = this.fbRootRef.child('users');
      const {
        fbRootRef,
      } = this;

      // create a promise tha resolves when the last users transaction is committed
      return new Promise((resolve, reject) => usersRef.orderByChild('createdAt').on('child_added', (snapshot) => {
        // operation per user
        const userId = snapshot.key();
        Logger.module('Script').log((`closed_beta_hard_wipe() -> Performing wallet wipe for user: ${userId}`).green);

        return FirebasePromises.set(fbRootRef.child('user-inventory').child(userId).child('wallet'), {
          gold_amount: 1000,
          spirit_amount: 0,
        })
          .then(() => {
            // record action to results
            const userResults = results[userId] || {};
            userResults.gaveAlphaGold = true;
            results[userId] = userResults;

            // resolve if we have reached the last key
            if (userId === mostRecentRegistrationKey) {
              return resolve();
            }
          });
      }));
    })
    .then(function () {
      const logRemovalPromises = [];
      logRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-logs')));
      logRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-aggregates')));
      return Promise.all(logRemovalPromises);
    })
    .then(() => results);
};

// Begin script execution
console.log(process.argv);

if (process.argv[2] === 'commit_wipe') {
  closed_beta_hard_wipe()
    .then((results) => {
      Logger.module('Script').log(('closed_beta_hard_wipe() -> completed').blue);
      console.log(JSON.stringify(results, null, 2));
      return process.exit(1);
    });
} else {
  Logger.module('Script').log(('call \'closed_beta_hard_wipe commit_wipe\' to perform wipe').blue);
  process.exit(1);
}
