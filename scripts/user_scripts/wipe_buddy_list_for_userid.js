/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

/*

	wipe_buddy_list_for_userid - Removes all friends for a user

	Examples:
  * Dry run
  coffee wipe_buddy_list_for_userid.coffee J_7WmwWlPj0viudZs8G # the hyphen is implied due to bash hyphen passing
  * commit wipe
  coffee wipe_buddy_list_for_userid.coffee J_7WmwWlPj0viudZs8G commit_wipe

*/

// region Requires
// Configuration object
const config = require("../../config/config.js");
const Firebase = require("firebase");
const _ = require("underscore");
const fbRef = new Firebase(config.get("firebase"));
const Promise = require('bluebird');

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get("firebaseToken");
const UsersModule = require("../../server/lib/users_module");
const DuelystFirebase= require("../../server/lib/duelyst_firebase_module");
const fbUtil = require('../../app/common/utils/utils_firebase.js');
const get_conversation_partners_of_userid = require('./get_conversation_partners_of_userid.coffee');
// endregion Requires

let displayProgressInterval = 0;
let dryRun = true;

// Returns a promise that resolves when wipe is completed
const wipe_buddy_list_for_userid = function(userId) {

	let locFbRootRef = null;
	return DuelystFirebase.connect().getRootRef()
	.then(function(fbRootRef) {
		locFbRootRef = fbRootRef;

		// remove all buddies this user has
		if (!dryRun) {
			locFbRootRef.child('users').child(userId).child('buddies').remove();
		}

		// find the last user key (so we can iterate through all users to remove this user from their list)
		return new Promise((resolve, reject) => locFbRootRef.child('username-index').orderByKey().limitToLast(1).once("child_added",function(snapshot) {
            console.log("wipe_buddy_list_for_userid - final user key found: " + snapshot.val());
            return resolve(snapshot.val());
        }));}).then(finalUserKey => // go through all users and remove this user from their buddy list
    new Promise(function(resolve, reject) {
        let usersOn;
        let usersProcessed = 0;
        return usersOn = locFbRootRef.child('username-index').orderByKey().on("child_added", function(snapshot) {
            const currentUserId = snapshot.val();
            usersProcessed++;
            if (displayProgressInterval && ((usersProcessed % displayProgressInterval) === 0)) {
                console.log(`wipe_buddy_list_for_userid - Processed ${usersProcessed} users`);
            }

            if (!dryRun) {
                return locFbRootRef.child('users').child(currentUserId).child('buddies').child(userId).remove( function(err) {
                    if (snapshot.val() === finalUserKey) {
                        locFbRootRef.child('users').off("child_added",usersOn);
                        // finished removing this user from everyones buddy list
                        return resolve();
                    }
                });
            } else {
                if (snapshot.val() === finalUserKey) {
                    locFbRootRef.child('users').off("child_added",usersOn);
                    // finished removing this user from everyones buddy list
                    return resolve();
                }
            }
        });
    }));
};

// Handle execution as a script
if (process.argv[1].toString().indexOf('wipe_buddy_list_for_userid.coffee') !== -1) {
	// Check usage
	if (!process.argv[2]) {
		console.log("Unexpected usage.");
		console.log("Given: " + process.argv);
		console.log("Expected: wipe_buddy_list_for_userid \'user-id\'");
		throw new Error("no userid provided");
		process.exit(1);
	}

	// check whether a dry run
	if (process.argv[3] === 'commit_wipe') {
		dryRun = false;
	} else {
		console.log("wipe_buddy_list_for_userid() -> Running dry run.");
	}

	// Begin script execution
	console.log(process.argv);

	const userId = "-" + process.argv[2];

	// if executing as a script we will display progress
	displayProgressInterval = 20;

	wipe_buddy_list_for_userid(userId)
	.then(function(relationshipsAdded) {
		console.log("Completed wiping buddies for user: " + userId);
		return process.exit(1);}).catch(function(error) {
		console.log("Error wiping buddies for user " + userId + ": " + error);
		return process.exit(1);
	});
}

module.exports = wipe_buddy_list_for_userid;
