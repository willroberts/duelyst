/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
//### THIS IS A SPECIAL VERSION FOR CODEX GENERATION, NOT INTENDED FOR USE ELSEWHERE

const i18next = require('i18next');
const Promise = require('bluebird');
const translation_en = require("../../app/localization/locales/en/index.json");

const options = {
	lng: 'en',
	fallbackLng: 'en',
	contextSeparator: '$',
	defaultNS: 'translation',
	resources: {
		en: {
	      translation: translation_en
	    }
	}
};

const p = new Promise((resolve, reject) => i18next
    .init(options, function(err,t){
        if (err) {
            return reject(err);
        } else {
            return resolve(t);
        }
}));


module.exports = p;
