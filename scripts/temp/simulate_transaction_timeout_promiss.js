/* eslint-disable
    import/no-extraneous-dependencies,
    import/no-unresolved,
    no-console,
    no-underscore-dangle,
    no-use-before-define,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Promise = require('bluebird');
const PrettyError = require('pretty-error');
const ProgressBar = require('progress');
const _ = require('underscore');

const path = require('path');
require('app-module-path').addPath(path.join(__dirname, '../../'));
const SDK = require('app/sdk');
const knex = require('server/lib/data_access/knex');
const GauntletModule = require('server/lib/data_access/gauntlet');
const InventoryModule = require('server/lib/data_access/inventory');
const UsersModule = require('server/lib/data_access/users');

// configure pretty error
const prettyError = new PrettyError();
prettyError.skipNodeFiles();
prettyError.skipPackage('bluebird');

const p = knex.transaction((tx) => Promise.resolve(tx('users').first().forUpdate())
  .then((userRow) => tx('user_progression').first()).delay(1000)
  .then((progression) => tx('user_faction_progression').first())
  .then((progression) => console.log('after delay'))
  .timeout(500)
  .catch((e) => {
    console.log(`EXCEPTION: ${e.message}`);
    throw e;
  })
  .finally(() => {
    console.log('FINALLY');
    return Promise.resolve(true);
  })).then(() => console.log('ALL DONE')).catch((e) => console.log(`ERROR: ${e.message}`)).finally(() => console.log(__guard__(knex.client != null ? knex.client.pool : undefined, (x) => x.stats())));

p.then(() => {
  console.log('exiting...');
  return process.exit(0);
});

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
