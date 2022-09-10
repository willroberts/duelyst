/* eslint-disable
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Promise = require('bluebird');
const i18next = require('i18next');
const XHR = require('i18next-xhr-backend');
const LngDetector = require('i18next-browser-languagedetector');
const Storage = require('app/common/storage');

const options = {
  whitelist: ['en', 'de'],
  fallbackLng: 'en',
  contextSeparator: '$',
  defaultNS: 'translation',
  backend: {
    loadPath: 'resources/locales/{{lng}}/index.json',
  },
  detection: {
    order: ['querystring', 'navigator'],
    lookupQuerystring: 'lng',
    lookupLocalStorage: `${Storage.namespace()}.i18nextLng`,
  },
};

const p = new Promise((resolve, reject) => {
  const preferredLanguageKey = Storage.get('preferredLanguageKey');

  if (preferredLanguageKey !== null) {
    options.lng = preferredLanguageKey;
  }

  return i18next
    .use(LngDetector)
    .use(XHR)
    .init(options, (err, t) => {
      if (err) {
        return reject(err);
      }
      return resolve(t);
    });
});

module.exports = p;
