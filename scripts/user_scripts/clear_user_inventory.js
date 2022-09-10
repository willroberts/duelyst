/* eslint-disable
    camelcase,
    import/extensions,
    import/no-unresolved,
    no-console,
    no-tabs,
    no-undef,
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

	clear_user_inventory - takes a user id and wipes their inventory

	Examples:
  clear_user_inventory -J_7WmwWlPj0viudZs8G

*/

// region Requires
// Configuration object
const Firebase = require('firebase');
const _ = require('underscore');
const config = require('../../config/config.js');

const fbRef = new Firebase(config.get('firebase'));

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get('firebaseToken');
const UsersModule = require('../../server/lib/users_module');
const DuelystFirebase = require('../../server/lib/duelyst_firebase_module');
const fbUtil = require('../../app/common/utils/utils_firebase.js');
// endregion Requires

// Performs an inventory clear for a user_id within a promise
const clear_user_inventory = (userId) => DuelystFirebase.connect().getRootRef()
  .then((fbRootRef) => {
    console.log(`clear_user_inventory( ${userId})`);
    fbRootRef.child('user-inventory').child(userId).child('card-collection').remove();
    fbRootRef.child('user-inventory').child(userId).child('used-booster-packs').remove();
    fbRootRef.child('user-inventory').child(userId).child('booster-packs').remove();
    fbRootRef.child('user-inventory').child(userId).child('wallet').remove();
    fbRootRef.child('user-decks').child(userId).remove();
    return UsersModule.initializeWallet(userId);
  });

// Handle execution as a script
if (process.argv[1].toString().indexOf('clear_user_inventory') !== -1) {
  // Check usage
  if (!process.argv[2]) {
    console.log('Unexpected usage.');
    console.log(`Given: ${process.argv}`);
    console.log('Expected: clear_user_inventory \'user-id\'');
    throw new Error('no userid provided');
    process.exit(1);
  }

  // Begin script execution
  console.log(process.argv);

  clear_user_inventory(argv[2])
    .then(() => console.log(`Cleared inventory of user: ${argv[2]}`)).catch((error) => console.log(`Error clearing inventory for user ${argv[2]}: ${error}`));
}

module.exports = clear_user_inventory;
