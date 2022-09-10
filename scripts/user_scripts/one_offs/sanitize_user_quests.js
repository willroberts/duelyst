/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

/*

	sanitize_user_quests - Cleans up quests so users only have 2 quests, and no invalid quests


	Examples: (no parameters required)
  sanitize_user_quests

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


const sanitize_user_quests = function() {
	const results = {};

	return DuelystFirebase.connect().getRootRef()
	.bind({})
	.then(function(fbRootRef) {
		// Retrieves the most recently registered user so we know when we've given all users reward
		this.fbRootRef = fbRootRef;
		return new Promise( function(resolve,reject) {
			const usersRef = fbRootRef.child("users");
			return usersRef.orderByChild("createdAt").limitToLast(1).on("child_added", function(snapshot) {
				Logger.module("Script").log(("sanitize_user_quests() -> Most recently registered user id is: " + snapshot.key()).green);
				return resolve(snapshot.key());
			});
		});}).then(function(mostRecentRegistrationKey) {
		const usersRef = this.fbRootRef.child("users");
		return new Promise( (resolve, reject) => usersRef.orderByChild("createdAt").on("child_added", function(snapshot) {
            const userId = snapshot.key();

            // operation per user
            // get users quests
            return UsersModule.getQuestsRef(userId)
            .then(questsRef => new Promise(function(resolve, reject) {
                const updateQuestData = function(questData) {
                    if (questData) {
                        if (questData.daily && questData.daily.current && questData.daily.current.quests) {
                            const currentQuests = questData.daily.current.quests;
                            const validQuests = [];
                            const questIds = [];
                            // iterate over quests looking for invalid quests and gathering the valid ones
                            for (let questIndex in currentQuests) {
                                const questEntryData = currentQuests[questIndex];
                                const quest = QuestFactory.questForIdentifier(questEntryData.q_id);
                                questIds.push(questEntryData.q_id);
                                if (quest === undefined) {
                                    Logger.module("Script").log(`sanitize_user_quests() -> removing invalid quest id ${questEntryData.q_id} for user ${userId.blue}`.red);
                                } else {
                                    validQuests.push(questEntryData);
                                }
                            }

                            // prevent having 3 quests, there is at most 3 so if there is 3 just pop one
                            if (validQuests.length === 3) {
                                Logger.module("Script").log(`sanitize_user_quests() -> removing extra quest id ${validQuests[validQuests.length-1].q_id} for user ${userId.blue}`.red);
                                validQuests.pop();
                            }

                            // Refill for any quests removed (up to how many they had before, at most 2)
                            const targetNumberOfQuests = Math.min(questIds.length, 2);
                            while (validQuests.length < targetNumberOfQuests) {
                                // add a quest
                                const newQuest = QuestFactory.randomQuestForSlotExcludingIds(validQuests.length,questIds);
                                const newQuestData = UsersModule.firebaseQuestDataForQuest(newQuest);
                                questIds.push(newQuestData.q_id);
                                Logger.module("Script").log(`sanitize_user_quests() -> Added new quest id ${newQuestData.q_id} for user ${userId.blue}`.green);
                                if (newQuestData.q_id === undefined) {
                                    break;
                                }
                                validQuests.push(newQuestData);
                            }

                            // put valid quests into an object
                            const newQuests = {};
                            if (validQuests.length) {
                                for (let i = 0, end = validQuests.length-1, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
                                    newQuests[i] = validQuests[i];
                                }
                            }

                            questData.daily.current.quests = newQuests;
                        }
                    }

                    return questData;
                };

                const onUpdateQuestDataComplete = function(error,committed,snapshot) {
                    if (error) {
                        Logger.module("Script").log(`sanitize_user_quests() -> ERROR updating quests for user ${userId.blue}`.red);
                        return reject(error);
                    } else if (committed) {
                        Logger.module("Script").log(`sanitize_user_quests() -> COMMITTED for user ${userId.blue}`.green);
                        return resolve();
                    } else {
                        Logger.module("Script").log(`sanitize_user_quests() -> NOT COMMITTED for user ${userId.blue}`.yellow);
                        return resolve();
                    }
                };

                return questsRef.transaction(updateQuestData,onUpdateQuestDataComplete);
            })).then(function() {
                if (userId === mostRecentRegistrationKey) {
                    return resolve(results);
                }});
        }));
	});
};

// Begin script execution
console.log(process.argv);

sanitize_user_quests()
.then(function(results) {
	Logger.module("Script").log(("sanitize_user_quests() -> completed").blue);
	return process.exit(1);
});

