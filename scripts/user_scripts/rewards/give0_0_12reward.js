/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

/*

	give0_0_12reward - Gives all current accounts 2k gold

	Examples: (no parameters required)
  give0_0_12reward

*/

// region Requires
// Configuration object
const config = require("../../../config/config.js");
const Promise = require('bluebird');
const Firebase = require("firebase");
const _ = require("underscore");
const fbRef = new Firebase(config.get("firebase"));
const moment = require('moment');
const Logger = require('../../../app/common/logger.coffee');

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get("firebaseToken");
const UsersModule = require("../../../server/lib/users_module");
const DuelystFirebase = require("../../../server/lib/duelyst_firebase_module");
const fbUtil = require('../../../app/common/utils/utils_firebase.js');
// endregion Requires

const rewardKey = "0_0_12";
const walletReward = {gold_amount:2000};

// Resolves to an object filled with key-value pairs of (utc date)->(number of users registered on that date)
// Accepts a number of completed days to look back in time for users (reports current partial day but doesn't count it as one of the lookback days)
const give0_0_12reward = function() {
	const results = {usersGivenReward:0,usersAlreadyGivenReward:0};

	return DuelystFirebase.connect().getRootRef()
	.bind({})
	.then(function(fbRootRef) {
		// Retrieves the most recently registered user so we know when we've given all users reward
		this.fbRootRef = fbRootRef;
		return new Promise( function(resolve,reject) {
			const usersRef = fbRootRef.child("users");
			return usersRef.orderByChild("createdAt").limitToLast(1).on("child_added", function(snapshot) {
				Logger.module("Script").log(("give0_0_12reward() -> Most recently registered user id is: " + snapshot.key()).green);
				return resolve(snapshot.key());
			});
		});}).then(function(mostRecentRegistrationKey) {
		const usersRef = this.fbRootRef.child("users");
		return new Promise( (resolve, reject) => usersRef.orderByChild("createdAt").on("child_added", function(snapshot) {
            const userId = snapshot.key();
            return UsersModule.giveUserReward(userId,rewardKey,walletReward)
            .then(function(wasGivenReward) {
                Logger.module("Script").log("give0_0_12reward() -> processed most recently registered user.".green);
                if (wasGivenReward) {
                    results.usersGivenReward += 1;
                } else {
                    results.usersAlreadyGivenReward += 1;
                }
                if (userId === mostRecentRegistrationKey) {
                    return resolve(results);
                }});
        }));
	});
};

// Begin script execution
console.log(process.argv);

give0_0_12reward()
.then(function(results) {
	Logger.module("Script").log(("give0_0_12reward() -> completed").blue);
	Logger.module("Script").log((`give0_0_12reward() -> completed, gave ${results.usersGivenReward} users reward`).blue);
	Logger.module("Script").log((`give0_0_12reward() -> completed, ${results.usersAlreadyGivenReward} users already had reward\n`).blue);
	return process.exit(1);
});

