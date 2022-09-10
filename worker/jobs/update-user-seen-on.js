/* eslint-disable
    func-names,
    import/extensions,
    import/no-unresolved,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
Job - Update User Seen On
*/
const Promise = require('bluebird');
const moment = require('moment');
const config = require('../../config/config.js');
const Logger = require('../../app/common/logger');
const UsersModule = require('../../server/lib/data_access/users');

/**
 * Job - 'update-user-seen-on'
 * @param	{Object} job		Kue job
 * @param	{Function} done 	Callback when job is complete
 */
module.exports = function (job, done) {
  const userId = job.data.userId || null;
  const userSeenOn = job.data.userSeenOn || null;

  if (!userId) {
    return done(new Error('update-user-seen-on: User ID is not defined.'));
  }

  if (!userSeenOn) {
    return done(new Error('update-user-seen-on: User seenOn is not defined.'));
  }

  Logger.module('JOB').debug(`[J:${job.id}] Update User (${userId}) Seen On starting`);
  Logger.module('JOB').time(`[J:${job.id}] Update User (${userId}) Seen On`);

  return UsersModule.updateDaysSeen(userId, moment.utc(userSeenOn))
    .then(() => {
      Logger.module('JOB').timeEnd(`[J:${job.id}] Update User (${userId}) Seen On`);
      return done();
    }).catch((error) => done(error));
};
