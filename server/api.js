/* eslint-disable
    consistent-return,
    import/extensions,
    no-use-before-define,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
/*
Starts main application
*/
const os = require('os');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const request = require('request');
const Promise = require('bluebird');
const server = require('http').createServer(app);
const PrettyError = require('pretty-error');
const Logger = require('../app/common/logger');
const shutdown = require('./shutdown');
const mail = require('./mailer');

Promise.promisifyAll(mail);

// Setup http server and express app
const app = require('./express');

// Pretty error printing, helps with stack traces

const pe = new PrettyError();
pe.skipNodeFiles();

// Configuration object
const config = require('../config/config.js');

if (config.isDevelopment()) {
  Logger.module('SERVER').log('DEV MODE: enabling long stack support');
  process.env.BLUEBIRD_DEBUG = 1;
  Promise.longStackTraces();
}

// Methods to download assets from S3
// TODO : Put in module
const makeDirectory = (cb) => mkdirp((`${__dirname}/../public/${config.get('env')}`), (err) => {
  if (err != null) {
    return cb(err);
  } return cb(null);
});

const getIndexHtml = (url, cb) => request({ url: `${url}/index.html`, gzip: true })
  .on('error', (err) => cb(err)).on('response', (res) => {
    if (res.statusCode !== 200) {
      return cb(new Error(`request returned status ${res.statusCode}`));
    }
  }).pipe(fs.createWriteStream(`${__dirname}/../public/${config.get('env')}/index.html`))
  .on('error', (err) => cb(err))
  .on('finish', () => cb(null));

const getRegisterHtml = (url, cb) => request({ url: `${url}/register.html`, gzip: true })
  .on('error', (err) => cb(err)).on('response', (res) => {
    if (res.statusCode !== 200) {
      return cb(new Error(`request returned status ${res.statusCode}`));
    }
  }).pipe(fs.createWriteStream(`${__dirname}/../public/${config.get('env')}/register.html`))
  .on('error', (err) => cb(err))
  .on('finish', () => cb(null));

const setupDevelopment = () => server.listen(config.get('port'), () => {
  server.connected = true;
  return Logger.module('SERVER').log(`Duelyst '${config.get('env')}' started on port ${config.get('port')}`);
});

const setupProduction = () => makeDirectory((err) => {
  if (err != null) {
    Logger.module('SERVER').log(`setupDirectory() failed: ${err}`);
    return process.exit(1);
  }
  return getIndexHtml(config.get('s3_url'), (err) => {
    if (err != null) {
      Logger.module('SERVER').log(`getIndexHtml() failed: ${err}`);
      return process.exit(1);
    }
    return getRegisterHtml(config.get('s3_url'), (err) => {
      if (err != null) {
        Logger.module('SERVER').log(`getIndexHtml() failed: ${err}`);
        process.exit(1);
      }
      return server.listen(config.get('port'), () => {
        server.connected = true;
        return Logger.module('SERVER').log(`Duelyst '${config.get('env')}' started on port ${config.get('port')}`);
      });
    });
  });
});

process.on('uncaughtException', (err) => shutdown.errorShutdown(err));

if (config.isDevelopment()) {
  setupDevelopment();
}
if (config.isProduction()) {
  setupProduction();
}
