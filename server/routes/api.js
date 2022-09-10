/* eslint-disable
    camelcase,
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const express = require('express');
const Promise = require('bluebird');
const t = require('tcomb-validation');
const mail = require('../mailer');

Promise.promisifyAll(mail);
const Logger = require('../../app/common/logger');
const Errors = require('../lib/custom_errors');
const DuelystFirebase = require('../lib/duelyst_firebase_module');
const FirebasePromises = require('../lib/firebase_promises');
const isSignedIn = require('../middleware/signed_in');
const isFriend = require('../middleware/is_friend');
const meRoutes = require('./api/me');
const usersRoutes = require('./api/users');
const replaysRoutes = require('./api/replays/replays');
const config = require('../../config/config');
const types = require('../validators/types');
const validators = require('../validators');

const router = express.Router();

// # Require authetication for all /api routes
router.use('/api', isSignedIn);

// All users
// Requires users to be friends
// RANK, GAMES, STATS, FACTION PROGRESSION, RIBBONS PROGRESSION
router.use('/api/users/:user_id', isFriend);
router.use('/api/users/:user_id/rank', usersRoutes.rank);
router.use('/api/users/:user_id/games', usersRoutes.games);
router.use('/api/users/:user_id/stats', usersRoutes.stats);
router.use('/api/users/:user_id/faction_progression', usersRoutes.faction_progression);
router.use('/api/users/:user_id/ribbons', usersRoutes.ribbons);
router.use('/api/users/:user_id/rift', usersRoutes.rift);

// Me user
// RANK, INVENTORY, ARENA, CHALLENGES, QUESTS, REWARDS, NEW PLAYER PROGRESSION,
// DECKS, ACHIEVEMENTS, SHOP, STATS, PROFILE, GAMES, GIFT CRATE, SPECTATE TOKENS,
// FACTION PROGRESSION, RIBBONS PROGRESSION
router.use('/api/me/rank', meRoutes.rank);
router.use('/api/me/inventory', meRoutes.inventory);
router.use('/api/me/gauntlet/runs', meRoutes.gauntlet);
router.use('/api/me/challenges', meRoutes.challenges);
router.use('/api/me/quests', meRoutes.quests);
router.use('/api/me/rewards', meRoutes.rewards);
router.use('/api/me/new_player_progression', meRoutes.new_player_progression);
router.use('/api/me/decks', meRoutes.decks);
router.use('/api/me/achievements', meRoutes.achievements);
router.use('/api/me/shop', meRoutes.shop);
router.use('/api/me/stats', meRoutes.stats);
router.use('/api/me/profile', meRoutes.profile);
router.use('/api/me/games', meRoutes.games);
router.use('/api/me/crates', meRoutes.crates);
router.use('/api/me/spectate', meRoutes.spectate);
router.use('/api/me/faction_progression', meRoutes.faction_progression);
router.use('/api/me/ribbons', meRoutes.ribbons);
router.use('/api/me/gift_codes', meRoutes.gift_codes);
router.use('/api/me/referrals', meRoutes.referrals);
router.use('/api/me/rift', meRoutes.rift);

// replays API (anyone can call it)
router.use('/replays', replaysRoutes);

// QA / Testing
if (config.isDevelopment() || config.isStaging()) {
  router.use('/api/me/qa', meRoutes.qa);

  // Just a route for secure testing
  router.get('/api/me/securetest', (req, res, next) => {
    Logger.module('API').log(`user calling api/securetest ${req.user}`);
    return res.status(200).end();
  });
}

// REPORTING
router.post('/api/me/report_player', (req, res, next) => {
  const result = t.validate(req.body, validators.reportPlayerInput);
  if (!result.isValid()) {
    return res.status(400).json(result.errors);
  }

  const user_id = req.user.d.id;
  const email = req.user.d.email || null;
  const other_user_id = result.value.user_id;
  const {
    message,
  } = result.value;

  // Return immediately so not to wait for email to send
  res.status(200).json({});

  return DuelystFirebase.connect().getRootRef()
    .then((rootRef) => FirebasePromises.once(rootRef.child('users').child(other_user_id).child('username'), 'value')).then((snapshot) => {
      const username = snapshot.val();
      // we may not have the response email but we still send report
      return mail.sendPlayerReportAsync(username, other_user_id, message, user_id, email);
    })
    .catch((error) => Logger.module('API').error('Failed to send report player email.'));
});

module.exports = router;
