/* eslint-disable
    import/extensions,
    import/no-unresolved,
    import/order,
    no-empty,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const fs = require('fs');
const os = require('os');
const Promise = require('bluebird');
const Logger = require('../app/common/logger');
const config = require('../config/config.js');

if (config.isDevelopment()) {
  Logger.module('WORKER').log('DEV MODE: enabling long stack support');
  process.env.BLUEBIRD_DEBUG = 1;
  Promise.longStackTraces();
}

/*
Job Queue Consumer // aka Worker
*/
const kue = require('kue');

/*
Setup Kue connection
prefix namespaces the queue
*/
const worker = require('../server/redis/r-jobs');

// job failed
worker.on('job failed', (id, errorMessage) => {
  Logger.module('WORKER').error(`[J:${id}] has failed: ${errorMessage}`.red);
  return kue.Job.get(id, (err, job) => {
    if (err) { }
  });
});

/*
Kue Shutdown Event
Finishes current job, 10s timeout before shutting down.
*/
const cleanShutdown = () => worker.shutdown(10000, (err) => {
  if (err) {
    Logger.module('WORKER').error(`Shutdown error occured: ${err.message}`);
  }
  Logger.module('WORKER').log('Shutting down.');
  return process.exit(0);
});

process.on('SIGTERM', cleanShutdown);
process.on('SIGINT', cleanShutdown);
process.on('SIGHUP', cleanShutdown);
process.on('SIGQUIT', cleanShutdown);
process.on('SIGABRT', cleanShutdown);

/*
Setup Jobs
*/
const archiveGame = require('./jobs/archive-game');
const updateUserPostGame = require('./jobs/update-user-post-game');
const updateUserAchievements = require('./jobs/update-user-achievements');
const updateUserChargeLog = require('./jobs/update-user-charge-log');
const matchmakingSetupGame = require('./jobs/matchmaking-setupgame');
const matchmakingSearchRanked = require('./jobs/matchmaking-search-ranked');
const matchmakingSearchCasual = require('./jobs/matchmaking-search-casual');
const matchmakingSearchArena = require('./jobs/matchmaking-search-arena');
const matchmakingSearchRift = require('./jobs/matchmaking-search-rift');
const dataSyncUserBuddyList = require('./jobs/data-sync-user-buddy-list');
const dataSyncSteamFriends = require('./jobs/data-sync-steam-friends');
const processUserReferralEvent = require('./jobs/process-user-referral-event');
const updateUsersRatings = require('./jobs/update-users-ratings');
const updateUserSeenOn = require('./jobs/update-user-seen-on');

worker.process('archive-game', 1, archiveGame);
worker.process('update-user-post-game', 2, updateUserPostGame);
worker.process('update-user-achievements', 1, updateUserAchievements);
worker.process('update-user-charge-log', 1, updateUserChargeLog);
worker.process('matchmaking-setup-game', 1, matchmakingSetupGame);
worker.process('matchmaking-search-ranked', 1, matchmakingSearchRanked);
worker.process('matchmaking-search-casual', 1, matchmakingSearchCasual);
worker.process('matchmaking-search-arena', 1, matchmakingSearchArena);
worker.process('matchmaking-search-rift', 1, matchmakingSearchRift);
worker.process('data-sync-user-buddy-list', 1, dataSyncUserBuddyList);
worker.process('data-sync-steam-friends', 1, dataSyncSteamFriends);
worker.process('process-user-referral-event', 1, processUserReferralEvent);
worker.process('update-users-ratings', 1, updateUsersRatings);
worker.process('update-user-seen-on', 1, updateUserSeenOn);
