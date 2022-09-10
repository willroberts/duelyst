/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

/*

	wipe_0_0_16 - Wipes all users inventories and gives them gold based on current gold + 100g per booster pack


	Examples: (no parameters required)
  * Run a dry run of wipe
  wipe_0_0_16
  * Actually wipe the data and commit transactions
  wipe_0_0_16 commit_wipe


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
const QuestFactory = require('../../../app/sdk/quests/questFactory.coffee');

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get("firebaseToken");
const UsersModule = require("../../../server/lib/users_module");
const DuelystFirebase = require("../../../server/lib/duelyst_firebase_module");
const fbUtil = require('../../../app/common/utils/utils_firebase.js');
// endregion Requires

// stores whether or not we will commit changes for wipe
let dryRun = true;

// Resolves to a results object filled with data representing the results of the wipe
const wipe_0_0_16 = function() {
	const results = {};

	return DuelystFirebase.connect().getRootRef()
	.bind({})
	.then(function(fbRootRef) {
		// Retrieves the most recently registered user so we know when we've given all users reward
		this.fbRootRef = fbRootRef;
		return new Promise( function(resolve,reject) {
			const usersRef = fbRootRef.child("users");
			return usersRef.orderByChild("createdAt").limitToLast(1).on("child_added", function(snapshot) {
				Logger.module("Script").log(("wipe_0_0_16() -> Most recently registered user id is: " + snapshot.key()).green);
				return resolve(snapshot.key());
			});
		});}).then(function(mostRecentRegistrationKey) {
		const usersRef = this.fbRootRef.child("users");
		const inventoryRef = this.fbRootRef.child("user-inventory");
		const decksRef = this.fbRootRef.child("user-decks");

		// Uncomment to do faction progression wipe as well
//		factionProgressionRef = @fbRootRef.child("user-faction-progression")
		// remove all faction progression
//		if !dryRun
//			Logger.module("Script").log(("wipe_0_0_16() -> wiping faction progression tree").green)
//			factionProgressionRef.remove()

		// create a promise tha resolves when the last users transaction is committed
		return new Promise( (resolve, reject) => usersRef.orderByChild("createdAt").on("child_added", function(snapshot) {
            // operation per user
            const userId = snapshot.key();
            Logger.module("Script").log(("wipe_0_0_16() -> Performing wipe for user: " + userId).green);

            //# Clear the users decks
            if (!dryRun) {
                decksRef.child(userId).remove();
            }

            //# Perform per user transaction on their inventory
            // - on update of inventory
            const updateInventory = function(inventoryData) {
                if (inventoryData) {
                    const currentGold = (inventoryData.wallet != null ? inventoryData.wallet.gold_amount : undefined) || 0;
                    let numOpenedBoosters = 0;
                    if (inventoryData["used-booster-packs"]) {
                        numOpenedBoosters = Object.keys(inventoryData["used-booster-packs"]).length;
                    }
                    let numUnopenedBoosters = 0;
                    if (inventoryData["booster-packs"]) {
                        numUnopenedBoosters = Object.keys(inventoryData["booster-packs"]).length;
                    }

                    // calculate the rewarded gold
                    const rewardedGold = currentGold + ((numOpenedBoosters + numUnopenedBoosters) * 100);

                    // store the results
                    results[userId] = {};
                    results[userId].currentGold = currentGold;
                    results[userId].numOpenedBoosters = numOpenedBoosters;
                    results[userId].numUnopenedBoosters = numUnopenedBoosters;
                    results[userId].rewardedGold = rewardedGold;
                    results[userId].wipedSpirit = (inventoryData.wallet != null ? inventoryData.wallet.spirit_amount : undefined) || 0;

                    // committing changes to user inventory if not a dry run
                    if (!dryRun) {
                        // Clear the users inventory
                        inventoryData["card-collection"] = null;
                        inventoryData["used-booster-packs"] = null;
                        inventoryData["booster-packs"] = null;
                        if (inventoryData["wallet"]) {
                            inventoryData["wallet"].spirit_amount = 0;
                            inventoryData["wallet"].gold_amount = rewardedGold;
                            if (inventoryData["wallet"].shards) {
                                inventoryData["wallet"].shards.common = 0;
                                inventoryData["wallet"].shards.rare = 0;
                                inventoryData["wallet"].shards.epic = 0;
                                inventoryData["wallet"].shards.legendary = 0;
                            }
                        }
                    }
                }

                return inventoryData;
            };

            // - on completion of update, responsible for resolving the promise
            const onUpdateComplete = function(error, committed, snapshot) {
                if (error) {
                    Logger.module("Script").log(`wipe_0_0_16() -> ERROR updating inventory for user ${userId.blue}`.red);
                } else if (committed) {
                    Logger.module("Script").log(`wipe_0_0_16() -> COMMITTED for user ${userId.blue}`.green);
                } else {
                    Logger.module("Script").log(`wipe_0_0_16() -> NOT COMMITTED for user ${userId.blue}`.yellow);
                }

                if (userId === mostRecentRegistrationKey) {
                    return resolve(results);
                }
            };

            // - perform the transaction
            return inventoryRef.child(userId).transaction(updateInventory,onUpdateComplete);
        }));
	});
};

// Begin script execution
console.log(process.argv);

if (process.argv[2] === 'commit_wipe') {
	dryRun = false;
} else {
	Logger.module("Script").log(("wipe_0_0_16() -> Running dry run.").blue);
}

wipe_0_0_16()
.then(function(results) {
	Logger.module("Script").log(("wipe_0_0_16() -> completed").blue);
//	console.log(JSON.stringify(results,null,2))
	console.dir(results);
	return process.exit(1);
});

