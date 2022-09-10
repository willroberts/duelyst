/* eslint-disable
    import/no-extraneous-dependencies,
    import/no-unresolved,
    max-len,
    no-console,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// libraries
const path = require('path');
require('app-module-path').addPath(path.join(__dirname, '../..'));

const npmRun = require('npm-run');

const Promise = require('bluebird');
const _ = require('underscore');
const moment = require('moment');
const fs = require('fs');

const helpers = require('scripts/helpers');
const UtilsLocalization = require('scripts/localization/utils_localization');

const runCommand = (commandStr) => new Promise((resolve, reject) => npmRun(commandStr, {}, (err, stdOut, stdErr) => {
  if (err != null) {
    return reject(err);
  }
  return resolve(stdOut);
}));

Promise.resolve()
  .bind({})
  .then(() => Promise.all([
    UtilsLocalization.readFileToJsonData(`${UtilsLocalization.PATH_TO_LOCALES}/en/index.json`),
    // UtilsLocalization.readFileToJsonData(UtilsLocalization.PATH_TO_LOCALES + "/de/index.json")
  ])).then(() => {
    console.log('Complete.');
    return process.exit(1);
  });
