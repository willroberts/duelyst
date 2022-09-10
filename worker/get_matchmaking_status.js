/* eslint-disable
    func-names,
    import/extensions,
    import/no-unresolved,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Colors 		= require('colors');
const Promise 	= require('bluebird');
const request 	= require('superagent');
const Logger 		= require('../app/common/logger');
const config 		= require('../config/config.js');
const Consul 		= require('../server/lib/consul');
const CustomError = require('../server/lib/custom_errors');

const isMatchmakingActiveAsync = function () {
  if (!config.get('consul.enabled')) {
    Logger.module('GAME CREATE').debug('No need to check matchmaking stack status since no CONSUL in environment.'.cyan);
    return Promise.resolve(true);
  }

  return Consul.kv.get(`environments/${process.env.NODE_ENV}/matchmaking-status.json`)
    .then(JSON.parse)
    .then((matchmakingStatus) => {
      // matchmakingEnabled is currently a string
      if (matchmakingStatus.enabled) {
        Logger.module('GAME CREATE').debug('Matchmaking status is active'.cyan);
        return true;
      }
      Logger.module('GAME CREATE').debug('Matchmaking status is inactive'.red);
      return Promise.reject(new CustomError.MatchmakingOfflineError('Matchmaking is currently offline, please retry shortly.'));
    });
};

module.exports = isMatchmakingActiveAsync;
