/* eslint-disable
    camelcase,
    global-require,
    import/extensions,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const express = require('express');

const router = express.Router();

const expressJwt = require('express-jwt');
const util = require('util');
const uuid = require('node-uuid');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const fs = require('fs');
const hbs = require('hbs');

const {
  handlebars,
} = hbs;
const moment = require('moment');

const generatePushId = require('../../app/common/generate_push_id');

// lib Modules
const isSignedIn = require('../middleware/signed_in');
const Logger = require('../../app/common/logger');
const Errors = require('../lib/custom_errors');

// Configuration object
const config = require('../../config/config.js');

// set up AWS
AWS.config.update({
  accessKeyId: config.get('s3_client_logs.key'),
  secretAccessKey: config.get('s3_client_logs.secret'),
});

// create a S3 API client
const s3 = new AWS.S3();
// Promise.promisifyAll(s3)

// async promise to get client template
const loadClientLogsHandlebarsTemplateAsync = new Promise((resolve, reject) => {
  const readFile = Promise.promisify(require('fs').readFile);
  return readFile(`${__dirname}/../templates/client-logs.hbs`)
    .then((template) => {
      const hbs_template = handlebars.compile(template.toString());
      return resolve(hbs_template);
    }).catch((err) => reject(err));
});

// # Require authetication
router.use('/utility', isSignedIn);

router.post('/utility/client_logs', (req, res, next) => {
  const user_id = req.user.d.id;
  let log_id = moment().utc().format('YYYY-MM-DD---hh-mm-ss');
  log_id += `.${uuid.v4()}`;

  const bucket = config.get('s3_client_logs.bucket');
  const env = config.get('env');
  const filename = `${env}/${user_id}/${log_id}.html`;
  const url = `https://s3-us-west-1.amazonaws.com/${bucket}/${filename}`;

  return loadClientLogsHandlebarsTemplateAsync.then((template) => {
    // render client log as HTML
    const html = template(req.body);

    // upload parameters
    const params = {
      Bucket: bucket,
      Key: filename,
      Body: html,
      ACL: 'public-read',
      ContentType: 'text/html',
    };

    return s3.putObjectAsync(params);
  }).then(() => {
    Logger.module('EXPRESS').debug(`User ${user_id.blue} Client Logs Submitted to: ${url}`);
    return res.status(200).json({ logs_url: url });
  }).catch((err) => {
    Logger.module('EXPRESS').error(`ERROR UPLOADING ${user_id.blue} CLIENT LOGS to ${url} : ${err.message}`.red);
    return next(err);
  });
});

module.exports = router;
