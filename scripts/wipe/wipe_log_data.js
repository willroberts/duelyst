/* eslint-disable
    camelcase,
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

	wipe_log_data - Wipes all users inventories and gives them gold based on current gold + 100g per booster pack

	Examples: (no parameters required)
  * Does nothing
  wipe_log_data
  * Actually wipe the data
  wipe_log_data commit_wipe

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
const wipe_log_data = () => DuelystFirebase.connect().getRootRef()
  .bind({})
  .then(function (fbRootRef) {
    this.fbRootRef = fbRootRef;
    const treeRemovalPromises = [];

    treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-aggregates')));
    treeRemovalPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-logs')));

    return Promise.all(treeRemovalPromises);
  });

// Begin script execution
console.log(process.argv);

if (process.argv[2] === 'commit_wipe') {
  wipe_log_data()
    .then(() => {
      Logger.module('Script').log(('wipe_log_data() -> completed').blue);
      return process.exit(1);
    });
} else {
  Logger.module('Script').log(('call \'wipe_log_data commit_wipe\' to perform wipe').blue);
  process.exit(1);
}
