/* eslint-disable
    import/extensions,
    max-len,
    no-multi-assign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let RedisClient;
const Promise = require('bluebird');
const redis = require('redis');
const Logger = require('../../app/common/logger');

// Configure Redis
const config = require('../../config/config.js');

const redisIp = config.get('redis.ip');
const redisPort = config.get('redis.port');
const redisPassword = config.get('redis.password');

// promisifyAll
Promise.promisifyAll(redis);

// redis client
module.exports = (RedisClient = redis.createClient({ host: redisIp, port: redisPort, detect_buffers: true }));

// redis auth
if (redisPassword) {
  RedisClient.auth(redisPassword);
}

// Ready event
RedisClient.on('ready', () => Logger.module('REDIS').debug('client onReady'));

// Connect event
RedisClient.on('connect', () => Logger.module('REDIS').debug('client onConnect'));

// Error event
// TODO: We should probably do something if we receive an error
RedisClient.on('error', (error) => Logger.module('REDIS').error(`client onError: ${JSON.stringify(error)})`));
