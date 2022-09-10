/* eslint-disable
    func-names,
    implicit-arrow-linebreak,
    import/extensions,
    import/no-unresolved,
    max-len,
    no-multi-assign,
    no-param-reassign,
    no-plusplus,
    no-tabs,
    no-use-before-define,
    no-var,
    radix,
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
Job - Search for Matches
*/
const _ = require('underscore');
const util = require('util');
const Promise = require('bluebird');

const env = config.get('env');
const kue = require('kue');
const moment = require('moment');
const CONFIG = require('app/common/config');

// SDK
const FactionsLookup = require('app/sdk/cards/factionsLookup');
const FactionFactory = require('app/sdk/cards/factionFactory');
const knex = require('server/lib/data_access/knex');

const createSinglePlayerGame = require('server/lib/create_single_player_game');
const RankFactory = require('../../app/sdk/rank/rankFactory');
const GameType = require('../../app/sdk/gameType');
const Consul = require('../../server/lib/consul');
const config = require('../../config/config.js');
const Logger = require('../../app/common/logger.coffee');
const Errors = require('../../server/lib/custom_errors.coffee');

// redis
const Redis = require('../../server/redis');

const riftQueue = new Redis.PlayerQueue(Redis.Redis, { name: 'rift' });

/**
 * 'getRequeueParams'
 * Returns a Promise with the parameters for re-creating
 * queue search jobs. Will pull the parameters from Consul
 * or provide defaults when Consul isn't enabled
 * @return {Promise} with parameters object
 */
const getRequeueParams = function () {
  // Defaults if Consul is disabled or fails
  const defaults = {
    riftSearchRadiusIncrease: 1,
    delayMs: 7000,
    allowMatchWithLastOpponent: config.get('matchmakingDefaults.allowMatchWithLastOpponent'),
  };

  if (!config.get('consul.enabled')) {
    return Promise.resolve(defaults);
  }

  return Consul.kv.get(`environments/${process.env.NODE_ENV}/matchmaking-rift-params.json`)
    .then((v) => {
      let params = JSON.parse(v);
      params = _.extend(defaults, params);
      return params;
    }).catch((error) => // Just return the defaults if polling Consul fails
      defaults);
};

/**
 * 'requeueJob'
 * Puts a search for game job back on the queue
 * Logic to update searchRadius, delay, goes here
 * @param	{Object} job		Kue job
 */
const requeueJob = (job, done) => getRequeueParams()
  .then((params) => {
    // Logger.module("MATCHMAKING-RIFT-JOB").log("[#{job.id}] RIFT - getRequeueParams(): #{JSON.stringify(params)}")

    // Each attempt, we incease by parameters stored in Consul
    job.data.attempt++;
    job.data.searchRadius += params.riftSearchRadiusIncrease;
    job.data.delayMs = params.delayMs;
    job.data.lastAttemptAt = Date.now();

    Logger.module('MATCHMAKING-RIFT-JOB').log(`[${job.id}] ${job.data.gameType.yellow} - \
Search for Game (${job.data.userId}) metric:(job.data.rank), \
attempt ${job.data.attempt}, \
delay ${job.data.delayMs}ms, \
searchRadius ${job.data.searchRadius}`);

    // Recreate as new job with updated parameters (and delayed)
    return new Promise((resolve, reject) => Redis.Jobs.create('matchmaking-search-rift', job.data)
      .delay(job.data.delayMs)
      .removeOnComplete(true)
      .save((err) => {
        if (err != null) {
          return reject(err);
        }
        return resolve();
      }));
  }).then(() => done()).catch((error) => done(error));

/**
 * 'logMatchMade'
 * Logs that a match was made in the queue (used for wait time calculations)
 * @param	{Object} player 1's matchmaking token
 * @param	{Object} player 2's matchmaking token
 */
const logMatchMade = function (token1, token2) {
  const now = Date.now();
  const waitTime1 = now - token1.createdAt;
  const waitTime2 = now - token2.createdAt;
  riftQueue.matchMade('rift', waitTime1);
  return riftQueue.matchMade('rift', waitTime2);
};

/**
 * 'findLockablePlayer'
 * Find the first lockable player when provided with an array of player ids
 * Recursive calls itself until lock is found
 * Returns null if no lock found
 * @param {Array} player ids
 * @return {Object} lock, the locked player
 * @return {String} lock.id, the player's id
 * @return {Function} lock.unlock, the unlock function to call when done
 */
var findLockablePlayer = function (players) {
  if (players.length === 0) {
    return null;
  }

  return Redis.TokenManager.lock(players[0])
    .then((unlock) => {
      if (_.isFunction(unlock)) {
        return { id: players[0], unlock };
      }
      players = players.slice(1);
      return findLockablePlayer(players);
    });
};

/**
 * 'findOpponent'
 * Searches the queue for list of potential opponents
 * Attempts to find lockable player
 * @param 	{String} 	userId, 			filters out from search results
 * @param 	{String} 	lastOpponentId 		filters out from search results
 * @param 	{Integer} 	rank
 * @param 	{Integer} 	radius
 * @return 	{Object} lock, see 'findLockablePlayer'
 */
const findOpponent = (userId, lastOpponentId, rank, radius) => getRequeueParams()
  .bind({})
  .then(function (params) {
    this.allowMatchWithLastOpponent = params.allowMatchWithLastOpponent;
    return riftQueue.search({ score: rank, searchRadius: radius });
  }).then(function (players) {
    // exclude the user that's looking
    players = _.filter(players, (id) => id !== userId);

    // exclude last opponent
    if (!this.allowMatchWithLastOpponent && lastOpponentId) {
      Logger.module('MATCHMAKING-RIFT-JOB').debug(`excluding last opponent ${(lastOpponentId != null ? lastOpponentId.blue : undefined)}`);
      players = _.filter(players, (id) => id !== lastOpponentId);
    }

    return findLockablePlayer(players);
  });

/**
 * Job - 'matchmaking-search-rift'
 * @param	{Object} job		Kue job
 * @param	{Function} done 	Callback when job is complete
 */
module.exports = function (job, done) {
  const userId = job.data.userId || null;
  if (!userId) {
    return done(new Error('User ID is not defined.'));
  }

  // Logger.module("MATCHMAKING-RIFT-JOB").log("[J:#{job.id}] RIFT - Search for Game (#{userId})")

  // job data params
  // set defaults in none provided in initial job
  const gameType = job.data.gameType || GameType.Rift;
  const searchRadius = (job.data.searchRadius = job.data.searchRadius || 0);
  const delayMs = (job.data.delayMs = job.data.delayMs || 5000);
  const attempt = (job.data.attempt = job.data.attempt || 1);
  const firstAttemptAt = (job.data.firstAttemptAt = job.data.firstAttemptAt || Date.now());
  const lastAttemptAt = (job.data.lastAttemptAt = job.data.lastAttemptAt || Date.now());
  const {
    tokenId,
  } = job.data;

  // 1a. check if player *this* player is still in queue, otherwise done()
  // 1b. check if player *this* player is locked by another job, otherwise requeue()
  // 1c. check if this job matches the matchmaking tokenId, otherwise die since it's an old job for a cancelled matchmaking request
  // 2.  attempt to acquire lock on player
  // 3.  search the queue for other players based on rank and search radius
  // 4.  if no results found, then requeueJob()
  // 5.  if opponent found, we have a lock on the opponent, retrieve opponent's tokens
  // 6.  remove the players from the queue (delete their placeholder in queue and clear their tokens)
  // 7.  create game with both player's tokens

  const isQueued = riftQueue.isPlayerQueued(userId);
  const isLocked = Redis.TokenManager.isLocked(userId);

  // grab player token
  const playerToken = Redis.TokenManager.get(userId);

  return Promise.join(isQueued, isLocked, playerToken, (isQueued, isLocked, playerToken) => {
    if ((isQueued == null) || (playerToken == null)) {
      Logger.module('MATCHMAKING-RIFT-JOB').log(`[J:${job.id}] player (${userId}) is no longer queued (isQueued:${isQueued})`);
      return done(); // the player is no longer in queue
    }

    // isQueued is actually their current rank in the queue
    // let's save it onto the job so the requeue method can use it
    const rank = (job.data.rank = parseInt(isQueued));

    if (isLocked) {
      Logger.module('MATCHMAKING-RIFT-JOB').log(`[J:${job.id}] player (${userId}) is locked (isLocked:${isLocked})`);
      return requeueJob(job, done); // the player is 'locked' by another job
    }

    if (playerToken.id !== tokenId) {
      Logger.module('MATCHMAKING-RIFT-JOB').log(`[J:${job.id}] this job's token ${tokenId} is outdated compared to ${playerToken.id}... killing job`);
      return done(); // looks like this job is for a token that has since been replaced
    }

    return Redis.TokenManager.lock(userId, 1000)
      .then((unlock) => {
        if (!_.isFunction(unlock)) {
          Logger.module('MATCHMAKING-RIFT-JOB').log(`[J:${job.id}] RIFT - lock(${userId}) acquire failed!`);
          return requeueJob(job, done);
        }
        // Logger.module("MATCHMAKING-RIFT-JOB").log("[J:#{job.id}] RIFT - lock(#{userId}) acquired.")
        return findOpponent(userId, playerToken.lastOpponentId, rank, searchRadius)
          .then((opponent) => {
            if (!opponent) {
              // if we've waited 20 seconds, queue with a bot
              if (moment.duration(moment.utc().valueOf() - firstAttemptAt.valueOf()).asSeconds() > 25) {
                return Promise.all([
                  Redis.TokenManager.remove(playerToken.userId),
                  riftQueue.remove([playerToken.userId]),
                ]).then(() => knex('users').where('is_bot', true).offset(knex.raw('floor(random()*110)')).first('id', 'username')).then(function (randomBotRow) {
                  this.randomBotRow = randomBotRow;

                  // get random faction
                  const aiFactionId = _.sample([
                    FactionsLookup.Faction1,
                    FactionsLookup.Faction2,
                    FactionsLookup.Faction3,
                    FactionsLookup.Faction4,
                    FactionsLookup.Faction5,
                    FactionsLookup.Faction6,
                  ]);

                  // get random general from faction
                  const aiGeneralId = _.sample(FactionFactory.generalIdsForFaction(aiFactionId));
                  const aiDifficulty = 1.0;

                  // bots should use around ~12 random cards
                  const aiNumRandomCards = Math.floor(CONFIG.MAX_DECK_SIZE * 0.3);

                  Logger.module('MATCHMAKING-RIFT-JOB').log(`[J:${job.id}] ${gameType.yellow} - ${userId} has waited too long, matching with bot ${this.randomBotRow.username}`);

                  const gameSetupOptions = {
                    player: {
                      riftRating: playerToken.riftRating,
                    },
                  };

                  // create game
                  return createSinglePlayerGame(
                    playerToken.userId,
                    playerToken.name,
                    gameType,
                    playerToken.deck,
                    playerToken.cardBackId,
                    playerToken.battleMapIndexes,
                    randomBotRow.id,
                    randomBotRow.username,
                    aiGeneralId,
                    null,
                    aiDifficulty,
                    aiNumRandomCards,
                    playerToken.ticketId,
                    gameSetupOptions,
                  );
                }).then(function () {
                  // We're done
                  return done(null, { opponentName: this.randomBotRow.name });
                });
              }
              // no opponents found, unlock and requeue
              unlock();
              return requeueJob(job, done);
            }
            Logger.module('MATCHMAKING-RIFT-JOB').log(`[J:${job.id}] RIFT - searchQueue(${userId}): ${JSON.stringify(opponent)}`);
            return Redis.TokenManager.get(opponent.id)
              .bind({})
              .then(function (opponentToken) { // TODO: We should validate results
                this.token1 = playerToken;
                this.token2 = opponentToken;

                if (!(this.token1 != null ? this.token1.userId : undefined)) {
                  Logger.module('MATCHMAKING-RIFT-JOB').log(`[J:${job.id}] searchQueue(${userId}): ERROR: player token has no user id`);
                  throw new Errors.NotFoundError('player token has no user id');
                }
                if (!(this.token2 != null ? this.token2.userId : undefined)) {
                  Logger.module('MATCHMAKING-RIFT-JOB').log(`[J:${job.id}] searchQueue(${userId}): ERROR: opponent token has no user id`);
                  throw new Errors.UnexpectedBadDataError('opponent token has no user id');
                }

                return Promise.all([
                  Redis.TokenManager.remove(this.token1.userId),
                  Redis.TokenManager.remove(this.token2.userId),
                  riftQueue.remove([this.token1.userId, this.token2.userId]),
                ]);
              }).then(function (results) { // TODO: We should validate results
                // mark match made
                logMatchMade(this.token1, this.token2);

                // log it
                Logger.module('MATCHMAKING-RIFT-JOB').log(`[J:${job.id}] ${gameType.yellow} - Search for Game (${userId}) done(), matched versus ${this.token2.userId}`);
                job.log('Matched versus %s(%s)', this.token2.userId, this.token2.name);

                // Fire off job to setup game between both players
                Redis.Jobs.create('matchmaking-setup-game', {
                  name: 'Matchmaking Setup Game',
                  title: util.format('Game :: Setup Game :: %s versus %s', this.token1.name, this.token2.name),
                  token1: this.token1,
                  token2: this.token2,
                  gameType,
                }).removeOnComplete(true).save();

                // We're done
                return done(null, { opponentName: this.token2.name });
              })
              .catch(Errors.NotFoundError, (error) => done(error))
              .catch(Errors.UnexpectedBadDataError, (error) => {
                Logger.module('MATCHMAKING-RIFT-JOB').log(`[J:${job.id}] searchQueue(${userId}): removing opponent token ${opponent.id} due to error`);

                // dangling async removal of potentially bad opponent data
                Redis.TokenManager.remove(opponent.id);
                riftQueue.remove(opponent.id);

                // manual unlock before requeue
                unlock();

                return requeueJob(job, done);
              });
          });
      });
  }).catch((error) => done(error));
};
