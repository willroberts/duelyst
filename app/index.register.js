/* eslint-disable
    global-require,
    import/no-unresolved,
    no-return-assign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// localization setup
const whenLocalizationReady = require('app/localization/index');

whenLocalizationReady.then(() => {
  let register;
  const i18next = require('i18next');
  return register = require('./register');
});
