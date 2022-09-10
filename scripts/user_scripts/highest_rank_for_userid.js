/* eslint-disable
    camelcase,
    func-names,
    guard-for-in,
    implicit-arrow-linebreak,
    import/extensions,
    import/no-unresolved,
    import/order,
    no-console,
    no-restricted-syntax,
    no-tabs,
    no-unreachable,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

/*

	highest_rank_for_userid - Checks a user's current, top and history entries for their highest rank

	Examples:
  highest_rank_for_userid -J_7WmwWlPj0viudZs8G

*/

// region Requires
// Configuration object
const Firebase = require('firebase');
const _ = require('underscore');
const config = require('../../config/config.js');

const fbRef = new Firebase(config.get('firebase'));
const Promise = require('bluebird');

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get('firebaseToken');
const UsersModule = require('../../server/lib/users_module');
const DuelystFirebase = require('../../server/lib/duelyst_firebase_module');
const fbUtil = require('../../app/common/utils/utils_firebase.js');
const colors = require('colors');
// endregion Requires

// Resolves to the users highest achieved rank (Checks current, top, and history seasons)
const highest_rank_for_userid = (userId) => // Retrieve user's top ranking
  DuelystFirebase.connect().getRootRef()
    .then(function (fbRootRef) {
      this.fbRootRef = fbRootRef;
      return new Promise((resolve, reject) => {
        // Callback for retrieving ranked data
        const onUserRankingData = function (snapshot) {
          let currentRank; let
            topRank;
          const rankData = snapshot.val();
          if (rankData === null) {
            return reject(new Error(`No rank data for ${userId} at reference location ${snapshot.ref().toString()}`));
          }

          let highestRank = 30;

          // check current
          const {
            current,
          } = rankData;
          if (current) {
            currentRank = current.rank;
            currentRank = currentRank !== undefined ? currentRank : 30;
            topRank = current.top_rank;
            topRank = topRank !== undefined ? topRank : 30;
            highestRank = Math.min(highestRank, currentRank, topRank);
          }

          // check top
          const {
            top,
          } = rankData;
          if (top) {
            currentRank = top.rank;
            currentRank = currentRank !== undefined ? currentRank : 30;
            topRank = top.top_rank;
            topRank = topRank !== undefined ? topRank : 30;
            highestRank = Math.min(highestRank, currentRank, topRank);
          }

          // check history
          const rankHistory = rankData.history;
          if (rankHistory) {
            for (const key in rankHistory) {
              const value = rankHistory[key];
              currentRank = value.rank;
              currentRank = currentRank !== undefined ? currentRank : 30;
              topRank = value.top_rank;
              topRank = topRank !== undefined ? topRank : 30;
              highestRank = Math.min(highestRank, currentRank, topRank);
            }
          }

          return resolve(highestRank);
        };

        // Make the call with the callback
        return fbRootRef.child('user-ranking').child(userId).once('value', onUserRankingData);
      });
    });

// Handle execution as a script
if (process.argv[1].toString().indexOf('highest_rank_for_userid.coffee') !== -1) {
  // Check usage
  if (!process.argv[2]) {
    console.log('Unexpected usage.');
    console.log(`Given: ${process.argv}`);
    console.log('Expected: highest_rank_for_userid \'user-id\'');
    throw new Error('no userid provided');
    process.exit(1);
  }

  // Begin script execution
  console.log(process.argv);

  const userId = process.argv[2].toString();
  highest_rank_for_userid(userId)
    .then((highestRank) => {
      console.log(`Highest rank for user id ${userId.blue} is ${highestRank.toString().green}`);
      return process.exit(1);
    }).catch((error) => {
      console.log(`Error: ${error.message}`);
      return process.exit(1);
    });
}

module.exports = highest_rank_for_userid;
