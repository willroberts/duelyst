/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

/*

	sanitize_username_index - Makes all username index entries lowercase

	Examples:
  * Dry run
  coffee sanitize_username_index.coffee
  * commit changes
  coffee sanitize_username_index.coffee commit_changes

*/

// region Requires
// Configuration object
const config = require("../../../config/config.js");
const Firebase = require("firebase");
const _ = require("underscore");
const fbRef = new Firebase(config.get("firebase"));
const Promise = require('bluebird');

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get("firebaseToken");
const UsersModule = require("../../../server/lib/users_module");
const DuelystFirebase= require("../../../server/lib/duelyst_firebase_module");
const fbUtil = require('../../../app/common/utils/utils_firebase.js');
// endregion Requires

let displayProgressInterval = 0;
let dryRun = true;

// Returns a promise that resolves to the names that were converted
const sanitize_username_index = function() {
	console.log("Beggining sanitize_username_index()");
	const conversions = []; // array of strings representing conversions that occurred

	let locFbRootRef = null;
	return DuelystFirebase.connect().getRootRef()
	.then(function(fbRootRef) {
		locFbRootRef = fbRootRef;

		// find the last user key (so we can iterate through all users)
		return new Promise((resolve, reject) => locFbRootRef.child('username-index').orderByKey().limitToLast(1).once("child_added",function(snapshot) {
            console.log("sanitize_username_index - final user key found: " + snapshot.val());
            return resolve(snapshot.val());
        }));}).then(function(finalUserKey) {
		const localFinalUserKey = finalUserKey;
		// go through all users and remove this user from their buddy list
		const firebaseWritePromises = [];
		let usersProcessed = 0;
		return new Promise(function(resolve, reject) {
			let usersOn;
			return usersOn = locFbRootRef.child('username-index').orderByKey().on("child_added", function(snapshot) {
				// report progress
				usersProcessed++;
				if (displayProgressInterval && ((usersProcessed % displayProgressInterval) === 0)) {
					console.log(`sanitize_username_index - Processed ${usersProcessed} users`);
				}

				const currentUsername = snapshot.key();
				const allLowerUsername = currentUsername.toLowerCase();
				const currentUserId = snapshot.val();

				if (currentUsername !== allLowerUsername) {
					// remove old entry
					firebaseWritePromises.push(new Promise(function(resolve,reject) {
						if (!dryRun) {
							return locFbRootRef.child('username-index').child(currentUsername).remove( err => resolve(`Removed ${currentUsername} with id ${currentUserId}`));
						} else {
							return resolve(`Removed ${currentUsername} with id ${currentUserId}`);
						}
					}));

					// set new entry
					firebaseWritePromises.push(new Promise(function(resolve,reject) {
						if (!dryRun) {
							return locFbRootRef.child('username-index').child(allLowerUsername).set(currentUserId, err => resolve(`Set ${allLowerUsername} with id ${currentUserId}`));
						} else {
							return resolve(`Set ${allLowerUsername} with id ${currentUserId}`);
						}
					}));
				}

				if (currentUserId === localFinalUserKey) {
					console.log("Got final user" + currentUserId + `. Total of ${usersProcessed} users processed`);
					locFbRootRef.child('username-index').off("child_added",usersOn);
					return resolve(firebaseWritePromises);
				}
			});
		});}).then(firebaseWritePromises => Promise.settle(firebaseWritePromises));
};


// Handle execution as a script
if (process.argv[1].toString().indexOf('sanitize_username_index.coffee') !== -1) {

	// check whether a dry run
	if (process.argv[2] === 'commit_changes') {
		dryRun = false;
	} else {
		console.log("sanitize_username_index() -> Running dry run.");
	}

	// Begin script execution
	console.log(process.argv);

	// if executing as a script we will display progress
	displayProgressInterval = 20;

	sanitize_username_index()
	.then(function(results) {
		console.log("Completed sanitizing user keys");
		if (dryRun) {
			console.log("DRY RUN - NO CHANGES COMMITTED");
		}
		console.log("Conversions made:");
		console.log(_.map(results,function(res) {
			if (res.value) {
				return res.value();
			} else {
				return "No value";
			}
		}));
		return process.exit(1);}).catch(function(error) {
		console.log("Error sanitizing username keys: " + error);
		return process.exit(1);
	});
}

module.exports = sanitize_username_index;
