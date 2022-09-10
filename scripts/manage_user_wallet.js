/* eslint-disable
    consistent-return,
    default-case,
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
const fbUtil = require('../app/common/utils/utils_firebase.js');

if (process.argv[2]) {
  const email = process.argv[2];
  const action = process.argv[3];
  const amount = parseFloat(process.argv[4]);
  console.log(`searching for user: ${email}`);
  console.log(`hash: ${fbUtil.escapeEmail(email)}`);

  if (!amount) {
    throw new Error('Error: no user amount provided');
    process.exit(1);
  } else {
    UsersModule.userIdForEmail(email)
      .then((userId) => {
        if (!userId) {
          throw new Error('userid not found');
        } else {
          console.log(`found user ... ${action}ing ${amount}`);
          switch (action) {
            case 'add':
              return UsersModule.addGoldToWallet(userId, amount);
            case 'subtract':
              return UsersModule.addGoldToWallet(userId, -amount);
          }
        }
      }).then((walletData) => {
        console.log('WALLET: all done...');
        console.log(walletData);
        return process.exit(1);
      }).catch((error) => {
        console.log(error);
        return process.exit(1);
      });
  }
} else {
  throw new Error('no user email provided');
  process.exit(1);
}
