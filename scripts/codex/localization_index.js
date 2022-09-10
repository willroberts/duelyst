/* eslint-disable
    camelcase,
    import/no-extraneous-dependencies,
    no-mixed-spaces-and-tabs,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// ### THIS IS A SPECIAL VERSION FOR CODEX GENERATION, NOT INTENDED FOR USE ELSEWHERE

const i18next = require('i18next');
const Promise = require('bluebird');
const translation_en = require('../../app/localization/locales/en/index.json');

const options = {
  lng: 'en',
  fallbackLng: 'en',
  contextSeparator: '$',
  defaultNS: 'translation',
  resources: {
    en: {
	      translation: translation_en,
	    },
  },
};

const p = new Promise((resolve, reject) => i18next
  .init(options, (err, t) => {
    if (err) {
      return reject(err);
    }
    return resolve(t);
  }));

module.exports = p;
