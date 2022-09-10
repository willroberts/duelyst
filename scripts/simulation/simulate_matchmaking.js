/* eslint-disable
    func-names,
    global-require,
    import/no-unresolved,
    max-len,
    no-dupe-keys,
    no-param-reassign,
    no-plusplus,
    no-tabs,
    no-underscore-dangle,
    no-use-before-define,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
//
const Promise = require('bluebird');
const Logger = require('../../app/common/logger');
const generatePushId = require('../../app/common/generate_push_id');

//
const GameType = require('../../app/sdk/gameType');
const RarityFactory = require('../../app/sdk/cards/rarityFactory');
const RankFactory = require('../../app/sdk/rank/rankFactory');

// redis
const Redis = require('../../server/redis');

const rankedQueue = new Redis.PlayerQueue(Redis.Redis, { name: 'ranked' });
const rankedDeckValueQueue = new Redis.PlayerQueue(Redis.Redis, { name: 'ranked-deck-value' });

const addSomePlayers = function (c) {
  if (c == null) { c = 1; }
  Logger.module('SIMULATION').log(`adding ${c} players`);
  return (() => {
    const result = [];
    for (let i = 0, end = c, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
      const token = Redis.TokenManager.create({
        userId: generatePushId(),
        deck: [],
        factionId: 1,
        gameType: GameType.Ranked,
        rank: 30, // Math.round(Math.random() * 30)
        deckValue: 0, // Math.round(Math.random() * 10)
      });

      const division = __guard__(RankFactory.rankedDivisionAssetNameForRank(token.rank / 10), (x) => x.toLowerCase());

      Logger.module('SIMULATION').log(`adding ${division} player (${token.rank},${token.deckValue})`);

      result.push(Promise.all([
        Redis.TokenManager.add(token),
        rankedQueue.add(token.userId, token.rank),
        rankedDeckValueQueue.add(token.userId, token.deckValue),
        rankedQueue.velocity(''),
        Redis.Jobs.create('matchmaking-search-ranked', {
          name: 'Ranked Matchmaking Search',
          title: 'GAME :: #{token.userId} searching for game',
          userId: token.userId,
          name: token.name,
          gameType: GameType.Ranked,
          tokenId: token.id,
          rank: token.rank,
          deckValue: token.deckValue,
        }).removeOnComplete(true).save(),
      ]).catch((e) => Logger.module('SIMULATION').log('ERROR adding player', e)));
    }
    return result;
  })();
};

const startWorker = function () {
  // Job Queue Consumer // aka Worker
  const kue = require('kue');

  // Setup Kue connection
  // prefix namespaces the queue
  const worker = Redis.Jobs;

  // Start Kue GUI
  kue.app.listen(3000);
  Logger.module('WORKER').log('UI started on port 3000');

  // job failed
  worker.on('job failed', (id, errorMessage) => Logger.module('WORKER').log(`[J:${id}] has failed: ${errorMessage}`.red));

  /*
	When using delayed jobs, we must also check the delayed jobs with a timer,
	promoting them if the scheduled delay has been exceeded. This setInterval
	is defined within Queue#promote(ms,limit), defaulting to a check of
	top 200 jobs every 5 seconds. If you have a cluster of kue processes,
	you must call .promote in just one (preferably master) process or
	promotion race can happen.
	*/
  worker.promote(1000);

  /*
	Kue Shutdown Event
	Finishes current job, 10s timeout before shutting down.
	*/
  const cleanShutdown = () => worker.shutdown(
    (err) => {
      if (err) {
        Logger.module('WORKER').log(`Shutdown error occured: ${err.message}`);
      }
      Logger.module('WORKER').log('Shutting down.');
      return process.exit(0);
    },
    10000,
  );

  process.on('SIGTERM', cleanShutdown);
  process.on('SIGINT', cleanShutdown);
  process.on('SIGHUP', cleanShutdown);
  process.on('SIGQUIT', cleanShutdown);
  process.on('SIGABRT', cleanShutdown);

  const matchmakingSearchRanked = require('../../worker/jobs/matchmaking-search-ranked');
  return worker.process('matchmaking-search-ranked', matchmakingSearchRanked);
};

// start worker
startWorker();

// add players
setTimeout(addSomePlayers, 1000);

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
