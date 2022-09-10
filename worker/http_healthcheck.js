/* eslint-disable
    func-names,
    import/no-unresolved,
    max-len,
    no-return-assign,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// Boots up a basic HTTP server on port 8080
// Responds to /health endpoint with status 200
// Otherwise responds with status 404

const http 		= require('http');
const url 		= require('url');
const os = require('os');
const Promise		= require('bluebird');
const Logger 		= require('../app/common/logger');
const config = require('../config/config');
const knex 		= require('../server/lib/data_access/knex');
// mailer = require '../server/mailer'
// Promise.promisifyAll(mailer)

const MAX_QUEUED_ALLOWED = 25;

const poolStats = function (pool) {
  const stats = {
    size: pool.getPoolSize(),
    min: pool.getMinPoolSize(),
    max: pool.getMaxPoolSize(),
    available: pool.availableObjectsCount(),
    queued: pool.waitingClientsCount(),
  };
  return stats;
};

const healthcheck = function () {
  const server = http.createServer((req, res) => {
    const {
      pathname,
    } = url.parse(req.url);
    if (pathname === '/health') {
      Logger.module('MATCHMAKER').debug('HTTP health check : /health requested.');
      const pool = poolStats(knex.client.pool);
      return Promise.all([
        knex('knex_migrations').select('migration_time').orderBy('id', 'desc').limit(1),
      ])
        .timeout(5000)
        .spread((row) => {
          if (pool.queued >= MAX_QUEUED_ALLOWED) {
            // serverInfo = {
            // 	hostname: os.hostname()
            // 	environment: config.get('env')
            // 	pool: pool
            // }
            // mailer.sendErrorAlertAsync(serverInfo, {message: "Database operations queue above maximum limit (#{MAX_QUEUED_ALLOWED})"})
            return res.statusCode = 500;
          }
          return res.statusCode = 200;
        }).catch(Promise.TimeoutError, (e) => res.statusCode = 500)
        .catch((e) => res.statusCode = 500)
        .finally(() => {
          res.write(JSON.stringify({ pool }));
          return res.end();
        });
    }
    // Logger.module("MATCHMAKER").debug "HTTP health check: 404 bad request received."
    res.statusCode = 404;
    return res.end();
  });

  return server.listen(8080, () => Logger.module('MATCHMAKER').debug('HTTP health check : running on port 8080 /health.'));
};

module.exports = healthcheck;
