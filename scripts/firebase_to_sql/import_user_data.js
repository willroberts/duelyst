/* eslint-disable
    consistent-return,
    func-names,
    import/extensions,
    import/no-unresolved,
    import/order,
    max-len,
    no-console,
    no-plusplus,
    no-var,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

const config = require('../../config/config.js');
const Firebase = require('firebase');
const _ = require('underscore');
const moment = require('moment');

const fbRef = new Firebase(config.get('firebase'));
const util = require('util');
const fs = require('fs');
const Promise = require('bluebird');
const colors = require('colors');
const DuelystFirebaseModule = require('../../server/lib/duelyst_firebase_module');
const FirebasePromises = require('../../server/lib/firebase_promises');
const UsersModule = require('../../server/lib/users_module');

var processUsersStartingWith = function (rootRef, startingKey, lastUserKey, limitToCount, callback) {
  console.log(`Grabbing batch of ${limitToCount} users (starting with ${startingKey})`.green);

  let counter = 0;
  const usersRef = rootRef.child('users').orderByKey().startAt(startingKey).limitToFirst(limitToCount);
  return usersRef.on('child_added', (userSnapshot, error) => {
    counter++;
    console.log(`User ${(userSnapshot != null ? userSnapshot.key() : undefined)} @ ${counter}`);
    if (userSnapshot.key() === lastUserKey) {
      usersRef.off('child_added');
      return callback(true);
    } if (counter === limitToCount) {
      usersRef.off('child_added');
      return processUsersStartingWith(rootRef, userSnapshot.key(), lastUserKey, limitToCount, callback);
    }
  });
};

DuelystFirebaseModule.connect().getRootRef()

  .bind({})

  .then(function (fbRootRef) {
    console.log('CONNECTED... Looking for last user.');

    this.fbRootRef = fbRootRef;
    return FirebasePromises.once(this.fbRootRef.child('users').orderByKey().limitToLast(1), 'child_added');
  })
  .then(function (lastUserSnapshot) {
    console.log(`Found last user: ${lastUserSnapshot.key()}`);

    return new Promise((resolve, reject) => processUsersStartingWith(this.fbRootRef, undefined, lastUserSnapshot.key(), 20, () => resolve()));
  })
  .then(() => {
    console.log('ALL DONE!');
    return process.exit(1);
  })
  .catch((err) => {
    console.log('ERROR:', err);
    return process.exit(1);
  });
