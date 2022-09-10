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
/*
Job - Update User Progression
*/
const Promise = require('bluebird');
const colors = require('colors');
const config = require('../../config/config.js');
const UsersModule = require('../../server/lib/data_access/users');
const Logger = require('../../app/common/logger');

/**
 * Job - 'update-user-game-counters'
 * @param	{Object} job		Kue job
 * @param	{Function} done 	Callback when job is complete
 */
module.exports = function (job, done) {
  const gameId = job.data.gameId || null;
  const userId = job.data.userId || null;
  const factionId = job.data.factionId || null;
  const {
    isWinner,
  } = job.data;
  const {
    isDraw,
  } = job.data;
  const isUnscored = job.data.isUnscored || false;
  const {
    gameType,
  } = job.data;

  if (!gameId) {
    return done(new Error('Game ID is not defined.'));
  }
  if (!userId) {
    return done(new Error('User ID is not defined.'));
  }
  if (!factionId) {
    return done(new Error('factionId is not defined.'));
  }
  if (isWinner === undefined) {
    return done(new Error('isWinner is not defined.'));
  }
  if (!gameType) {
    return done(new Error('Game type is not defined.'));
  }

  Logger.module('JOB').debug(`[J:${job.id}] Update User (${userId}) Game Counters for game ${gameId}. UNSCORED: ${isUnscored} starting`);
  Logger.module('JOB').time(`[J:${job.id}] Update User (${userId}) Game Counters for game ${gameId}. UNSCORED: ${isUnscored}`);

  return Promise.all([
    UsersModule.updateGameCounters(userId, factionId, isWinner, gameType, isUnscored, isDraw),
  ]).then(() => {
    Logger.module('JOB').timeEnd(`[J:${job.id}] Update User (${userId}) Game Counters for game ${gameId}. UNSCORED: ${isUnscored}`);
    return done();
  }).catch((error) => done(error));
};
