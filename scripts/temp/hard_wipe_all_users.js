/* eslint-disable
    no-console,
    no-restricted-syntax,
    no-underscore-dangle,
    no-unreachable,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

const Promise = require('bluebird');
const UsersModule = require('../../server/lib/data_access/users');
const knex = require('../../server/lib/data_access/knex');
const DuelystFirebase = require('../../server/lib/duelyst_firebase_module');

knex('users').select().then((userRows) => {
  const allPromises = [];
  for (const row of Array.from(userRows)) {
    allPromises.push(UsersModule.___hardWipeUserData(row.id));
  }
  return Promise.all(allPromises);
}).then(() => {
  console.log('all done...');
  return process.exit(1);
})
  .catch((err) => {
    throw err;
    console.log('ERROR', err);
    return process.exit(1);
  });
