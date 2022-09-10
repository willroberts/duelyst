/* eslint-disable
    import/extensions,
    import/no-unresolved,
    no-console,
    no-unreachable,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

// Configuration object
const Firebase = require('firebase');
const _ = require('underscore');
const config = require('../config/config.js');

const fbRef = new Firebase(config.get('firebase'));

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get('firebaseToken');
const UsersModule = require('../server/lib/users_module');
const DuelystFirebaseModule = require('../server/lib/duelyst_firebase_module');
const fbUtil = require('../app/common/utils/utils_firebase.js');

if (process.argv[2]) {
  console.log(process.argv);

  const username = process.argv[2];
  console.log(`searching for username: ${username}`);

  UsersModule.userIdForUsername(username)
    .then((userId) => {
      if (!userId) {
        throw new Error('userid not found');
      } else {
        console.log(`found user ... ${userId}`);
        return process.exit(1);
      }
    }).catch((error) => {
      console.log(error);
      return process.exit(1);
    });
} else {
  throw new Error('no username provided');
  process.exit(1);
}
