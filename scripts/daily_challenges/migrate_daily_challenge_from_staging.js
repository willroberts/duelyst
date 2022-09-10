/* eslint-disable
    func-names,
    import/extensions,
    import/no-unresolved,
    import/order,
    max-len,
    no-console,
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

/*

	migrate_daily_challenge_from_staging - Transfers a daily challenge for a provided date from staging to the current NODE_ENV

	Example:
  * show usage
  migrate_daily_challenge_from_staging
  * Actually wipe the data and commit transactions
  coffee migrate_daily_challenge_from_staging fbStagingToken utc_date_key
  coffee migrate_daily_challenge_from_staging ahjsdasjhdgasdjh 2016-05-02
  coffee migrate_daily_challenge_from_staging ahjsdasjhdgasdjh 2016-05-02 force # Will overwrite if there is a challenge already at that date

*/

const config = require('../../config/config.js');
const Firebase = require('firebase');
const _ = require('underscore');
const moment = require('moment');

const fbRef = new Firebase(config.get('firebase'));
const util = require('util');
const fs = require('fs');
const Promise = require('bluebird');
const colors = require('colors');
const fetch = require('isomorphic-fetch');
const zlib 		= require('zlib');

// create a S3 API client
const AWS 		= require('aws-sdk');
const UtilsEnv = require('../../app/common/utils/utils_env');
const Logger = require('../../app/common/logger');
const DuelystFirebase = require('../../server/lib/duelyst_firebase_module');
const FirebasePromises = require('../../server/lib/firebase_promises');

AWS.config.update({
  accessKeyId: config.get('s3_archive.key'),
  secretAccessKey: config.get('s3_archive.secret'),
});
const s3 = new AWS.S3();
Promise.promisifyAll(s3);

let allowOverwrite = false;
let ignoreQAReady = false;

const migrateFromStagingToCurrentEnvironment = function (stagingToken, dateKey) {
  const stagingURL = 'https://duelyst-staging.firebaseio.com/';
  return Promise.all([
    DuelystFirebase.connect(stagingURL, stagingToken).getRootRef(),
    DuelystFirebase.connect().getRootRef(),
  ])
    .bind({})
    .spread(function (stagingRootRef, localRootRef) {
      Logger.module('Script').log('Connection made to staging and NODE firebase environments');
      this.stagingRootRef = stagingRootRef;
      this.localRootRef = localRootRef;

      // Get challenge from staging
      return Promise.all([
        FirebasePromises.once(this.stagingRootRef.child('daily-challenges').child(dateKey), 'value'),
        FirebasePromises.once(this.localRootRef.child('daily-challenges').child(dateKey), 'value'),
      ]);
    }).spread(function (stagingDailyChallengeSnapshot, localDailyChallengeSnapshot) {
      Logger.module('Script').log(`Retrieved data from staging for daily challenge at ${dateKey}`);
      this.stagingDailyChallengeSnapshot = stagingDailyChallengeSnapshot;
      this.localDailyChallengeSnapshot = localDailyChallengeSnapshot;

      if ((this.stagingDailyChallengeSnapshot == null) || (this.stagingDailyChallengeSnapshot.val() == null)) {
        Logger.module('Script').log(`No challenge found at date key (${dateKey}) on staging`);
        return Promise.reject(new Error(`No challenge found at date key (${dateKey}) on staging`));
      }

      if ((this.localDailyChallengeSnapshot != null) && (this.localDailyChallengeSnapshot.val() != null)) {
        if (!allowOverwrite) {
          Logger.module('Script').log(`A challenge already exists at date key (${dateKey}) on target environment (use force to overwrite)`);
          return Promise.reject(new Error(`A challenge already exists at date key (${dateKey}) on target environment (use force to overwrite)`));
        }
      }

      this.dailyChallengeData = this.stagingDailyChallengeSnapshot.val();
      Logger.module('Script').log(`Data at staging for daily challenge at ${dateKey} is:\n ${JSON.stringify(this.dailyChallengeData, null, 2)}`);

      if (!this.dailyChallengeData.isQAReady && !ignoreQAReady) {
        return Promise.reject(new Error(`Challenge at date key (${dateKey}) not marked as passing QA`));
      }

      if ((this.dailyChallengeData.url == null)) {
        return Promise.reject(new Error(`No challenge url found at date key (${dateKey}) on staging`));
      }

      const stagingChallengeURL = this.dailyChallengeData.url;

      Logger.module('Script').log(`Fetching challenge game data from url:\n${stagingChallengeURL}`);
      return Promise.resolve(fetch(stagingChallengeURL));
    })
    .then((res) => {
      Logger.module('Script').log('Completed fetching challenge game data');
      if (res.ok) {
        return res.json();
      }
      const err = new Error(res.statusText);
      err.status = res.status;
      throw err;
    })
    .then((data) => {
      Logger.module('Script').log(`Challenge game data ready to send to target\n${JSON.stringify(data, null, 2)}`);
      Promise.promisifyAll(zlib);

      return zlib.gzipAsync(JSON.stringify(data));
    })
    .then(function (gzipGameSessionData) {
      Logger.module('Script').log('Completed zipping challenge game data');
      this.gzipGameSessionData = gzipGameSessionData;

      let env = null;

      // Set up the new url
      env = null;
      if (UtilsEnv.getIsInLocal()) {
        env = 'local';
      } else if (UtilsEnv.getIsInStaging()) {
        return Promise.reject(new Error('Cannot migrate from staging to staging.'));
      } else if (UtilsEnv.getIsInProduction()) {
        env = 'production';
      } else {
        return Promise.reject(new Error('Unknown/Invalid ENV for storing Daily Challenge'));
      }

      const bucket = 'duelyst-challenges';

      const filename = `${env}/${dateKey}.json`;
      this.dailyChallengeData.url = `https://s3-us-west-2.amazonaws.com/${bucket}/${filename}`;

      const params = {
        Bucket: bucket,
        Key: filename,
        Body: this.gzipGameSessionData,
        ACL: 'public-read',
        ContentEncoding: 'gzip',
        ContentType: 'text/json',
      };

      return s3.putObjectAsync(params);
    })
    .then(function () {
      Logger.module('Script').log('Completed pushing snapshot to new location');
      return FirebasePromises.set(this.localRootRef.child('daily-challenges').child(dateKey), this.dailyChallengeData);
    })
    .then(() => Logger.module('Script').log('Migration complete'));
};

// Begin script execution
console.log(process.argv);

if ((process.argv.length !== 4) && (process.argv.length !== 5)) {
  // Show usage
  console.log('usage:');
  console.log('coffee migrate_daily_challenge_from_staging staging_key utc_date_key [force]');
  process.exit(1);
}

const fbStagingToken = process.argv[2];
const utcDateKey = process.argv[3];

if (process.argv.length === 5) {
  if (process.argv[4] === 'force') {
    allowOverwrite = true;
    ignoreQAReady = true;
  } else {
    console.log(process.argv[4]);
    console.log('usage:');
    console.log('coffee migrate_daily_challenge_from_staging staging_key utc_date_key [force]');
    process.exit(1);
  }
}

migrateFromStagingToCurrentEnvironment(fbStagingToken, utcDateKey)
  .then(() => {
    Logger.module('Script').log('Finished migrating daily challenge from staging to NODE_ENV environment');
    return process.exit(1);
  }).catch((error) => {
    Logger.module('Script').log(`Error: ${error.toString()}`);
    return process.exit(1);
  });
