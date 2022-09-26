/* eslint-disable
    func-names,
    import/extensions,
    no-class-assign,
    no-multi-assign,
    no-param-reassign,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Promise = require('bluebird');
const moment = require('moment');
const Logger = require('../../app/common/logger');
const config = require('../../config/config.js');

const env = config.get('env');
const generatePushID = require('../../app/common/generate_push_id');

// Helper returns the Game Data Redis key prefix
const keyPrefix = () => `${env}:watchable_games:`;

/**
 * Class 'RedisWatchableGamesManager'
 * Manages storage of games in Redis
 * Serialized games are stored by incrementing id
 * ttl sets the expiration time of keys, defaults to 72 hours
 */
class RedisWatchableGamesManager {
  /**
	 * Constructor
	 * @param {Object} redis, a promisified redis connection
	 */
  constructor(redis, opts) {
    // TODO: add check to ensure Redis client is already promisified
    if (opts == null) { opts = {}; }
    this.redis = redis;
  }

  /**
	 * Save json watchable game data to redis
	 * @param {String} the divison name for which to save/generate
	 * @param {Object} the json data
	 * @param {Function|optional} callback
	 * @return {Promise}
	 */
  saveGamesDataForDivision(divisionName, dataJson, callback) {
    divisionName = divisionName.toLowerCase();
    const dateKey = moment.utc().startOf('day').format('YYYY-MM-DD');
    const key = `${keyPrefix()}${divisionName}:${dateKey}`;
    Logger.module('REDIS').debug(`saveGamesDataForDivision() -> saving watchable game data for ${divisionName}`);

    const multi = this.redis.multi(); // start a multi command
    multi.set(key, dataJson);
    multi.expire(key, config.get('watchSectionCacheTTL')); // when to expire the cache

    return multi.execAsync()
      .nodeify(callback);
  }

  /**
	 * Load json watchable game data from redis
	 * @param {String} the divison name for which to load
	 * @param {Function|optional} callback
	 * @return {Promise}
	 */
  loadGamesDataForDivision(divisionName, callback) {
    divisionName = divisionName.toLowerCase();
    const dateKey = moment.utc().startOf('day').format('YYYY-MM-DD');
    const key = `${keyPrefix()}${divisionName}:${dateKey}`;
    Logger.module('REDIS').debug(`loadGamesDataForDivision() -> ${divisionName}`);

    return this.redis.getAsync(key)
      .then(JSON.parse)
      .nodeify(callback);
  }
}

/**
 * Export a factory
 */
module.exports = (exports = function (redis, opts) {
  RedisWatchableGamesManager = new RedisWatchableGamesManager(redis, opts);
  return RedisWatchableGamesManager;
});
