/* eslint-disable
    camelcase,
    consistent-return,
    func-names,
    import/extensions,
    import/no-unresolved,
    import/order,
    max-len,
    no-console,
    no-param-reassign,
    no-restricted-globals,
    no-tabs,
    radix,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

/*

	num_registrations_per_day - Takes a number of days to look back (assumes 5) and reports how many user registrations occurred per utc day

	Examples:
  num_registrations_per_day 7

*/

// region Requires
// Configuration object
const config = require('../../config/config.js');
const Promise = require('bluebird');
const Firebase = require('firebase');
const _ = require('underscore');

const fbRef = new Firebase(config.get('firebase'));
const moment = require('moment');
const Logger = require('../../app/common/logger');

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get('firebaseToken');
const UsersModule = require('../../server/lib/users_module');
const DuelystFirebase = require('../../server/lib/duelyst_firebase_module');
const fbUtil = require('../../app/common/utils/utils_firebase.js');
// endregion Requires

// Resolves to an object filled with key-value pairs of (utc date)->(number of users registered on that date)
// Accepts a number of completed days to look back in time for users (reports current partial day but doesn't count it as one of the lookback days)
const num_registrations_per_day = function (numDaysToLookBack) {
  if (numDaysToLookBack == null) { numDaysToLookBack = 5; }
  const startTodayMoment = moment().startOf('day');
  const oldestDayToRetrieve = startTodayMoment.subtract(numDaysToLookBack, 'days');
  const results = {};
  Logger.module('Script').log((`num_registrations_per_day() -> looking back ${numDaysToLookBack} days`).green);

  return DuelystFirebase.connect().getRootRef()
    .bind({})
    .then(function (fbRootRef) {
      // Retrieves the most recently registered user so we know when we've retrieved all registered users in our range
      this.fbRootRef = fbRootRef;
      return new Promise((resolve, reject) => {
        const usersRef = fbRootRef.child('users');
        return usersRef.orderByChild('createdAt').limitToLast(1).on('child_added', (snapshot) => {
          Logger.module('Script').log((`num_registrations_per_day() -> Most recently registered user id is: ${snapshot.key()}`).green);
          return resolve(snapshot.key());
        });
      });
    })
    .then(function (mostRecentRegistrationKey) {
      const usersRef = this.fbRootRef.child('users');
      return new Promise((resolve, reject) => usersRef.orderByChild('createdAt').startAt(oldestDayToRetrieve.valueOf()).endAt(moment().valueOf()).on('child_added', (snapshot) => {
        const userCreatedMoment = moment(snapshot.child('createdAt').val());
        const resultsKey = userCreatedMoment.format('MMM DD');
        results[resultsKey] = (results[resultsKey] || 0) + 1;
        if (snapshot.key() === mostRecentRegistrationKey) {
          Logger.module('Script').log('num_registrations_per_day() -> processed most recently registered user.'.green);
          return resolve(results);
        }
      }));
    });
};

// Handle execution as a script
if (process.argv[1].toString().indexOf('num_registrations_per_day') !== -1) {
  let numDaysToLookBack;
  if (process.argv[2]) {
    numDaysToLookBack = parseInt(process.argv[2]);
    if (isNaN(numDaysToLookBack)) {
      numDaysToLookBack = undefined;
    }
  }

  // Begin script execution
  console.log(process.argv);

  num_registrations_per_day(numDaysToLookBack)
    .then((results) => {
      Logger.module('Script').log((`num_registrations_per_day() -> results\n${JSON.stringify(results, null, 2)}`).blue);
      return process.exit(1);
    });
}

module.exports = num_registrations_per_day;
