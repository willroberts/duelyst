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
Job - Update User Ranking
*/
const config = require('../../config/config.js');
const QuestsModule = require('../../server/lib/data_access/quests');
const Logger = require('../../app/common/logger');
const { GameManager } = require('../../server/redis');

/**
 * Job - 'update-user-quests'
 * @param	{Object} job		Kue job
 * @param	{Function} done 	Callback when job is complete
 */
module.exports = function (job, done) {
  const gameId = job.data.gameId || null;
  const userId = job.data.userId || null;

  if (!gameId) {
    return done(new Error('Game ID is not defined.'));
  }
  if (!userId) {
    return done(new Error('User ID is not defined.'));
  }

  Logger.module('JOB').debug(`[J:${job.id}] Update User (${userId}) Quests for game ${gameId} starting`);
  Logger.module('JOB').time(`[J:${job.id}] Update User (${userId}) Quests for game ${gameId}`);

  return GameManager.loadGameSession(gameId)
    .then(JSON.parse)
    .then((gameSessionData) => {
      if (!gameSessionData) {
        throw new Error('Game data is null. Game may have already been archived.');
      } else {
        return QuestsModule.updateQuestProgressWithGame(userId, gameId, gameSessionData);
      }
    }).then(() => {
      Logger.module('JOB').timeEnd(`[J:${job.id}] Update User (${userId}) Quests for game ${gameId}`);
      return done();
    })
    .catch((error) => done(error));
};
