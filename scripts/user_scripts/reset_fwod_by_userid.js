/* eslint-disable
    camelcase,
    import/extensions,
    import/no-unresolved,
    import/order,
    max-len,
    no-console,
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

	reset_fwod_by_userid - resets the users fwod tracker so they can get another fwod

	Examples:
  for user id -J_7WmwWlPj0viudZs8G
  reset_fwod_by_userid.coffee J_7WmwWlPj0viudZs8G # the hyphen is implied due to bash hyphen passing

*/

// region Requires
// Configuration object
const config = require('../../config/config.js');
const Firebase = require('firebase');
const _ = require('underscore');

const fbRef = new Firebase(config.get('firebase'));
const Promise = require('bluebird');

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get('firebaseToken');
const UsersModule = require('../../server/lib/users_module');
const DuelystFirebase = require('../../server/lib/duelyst_firebase_module');
const fbUtil = require('../../app/common/utils/utils_firebase.js');
// endregion Requires

// Performs an inventory clear for a user_id within a promise
const reset_fwod_by_userid = (userId) => new Promise((resolve, reject) => DuelystFirebase.connect().getRootRef()
  .then((fbRootRef) => {
    console.log(`reset_fwod_by_userid( ${userId})`);
    return fbRootRef.child('user-progression').child(userId).child('game-counter').child('last_daily_win_at')
      .remove((error) => {
        if (error) {
          console.log('reset_fwod_by_userid: remove failed');
          return reject(error);
        }
        console.log('reset_fwod_by_userid: remove success');
        return resolve();
      });
  }));

// Handle execution as a script
if (process.argv[1].toString().indexOf('reset_fwod_by_userid') !== -1) {
  // Check usage
  if (!process.argv[2] || (process.argv.length > 3)) {
    console.log('Unexpected usage.');
    console.log(`Given: ${process.argv}`);
    console.log('Expected: reset_fwod_by_userid \'user-id\'');
    throw new Error('no userid provided');
    process.exit(1);
  }

  // Begin script execution
  console.log(process.argv);

  const userId = `-${process.argv[2]}`;

  reset_fwod_by_userid(userId)
    .then(() => {
      console.log(`Reset fwod of user: ${userId} completed`);
      return process.exit(1);
    }).catch((error) => {
      console.log(`Error resetting fwod for user ${userId}: ${error}`);
      return process.exit(1);
    });
}

module.exports = reset_fwod_by_userid;
