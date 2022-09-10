/* eslint-disable
    import/extensions,
    import/no-unresolved,
    no-multi-assign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
let Jobs;
const kue = require('kue');
const Logger = require('../../app/common/logger.coffee');
const config = require('../../config/config.js');

const env = config.get('env');
const redisIp = config.get('redis.ip');
const redisPort = config.get('redis.port');
const redisPassword = config.get('redis.password');

/**
 * 'Jobs'
 * Exports the Kue createQueue factory
 * Note that Kue manages its own Redis connections
 * We must pass the prefix and connection settings
 */
module.exports = (Jobs = kue.createQueue({
  prefix: `${env}:q`,
  disableSearch: true,
  redis: {
    port: config.get('redis.port'),
    host: config.get('redis.ip'),
    auth: config.get('redis.password'),
  },
}));
