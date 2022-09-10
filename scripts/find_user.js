/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

// Configuration object
const config = require("../config/config.js");
const Firebase = require("firebase");
const _ = require("underscore");
const fbRef = new Firebase(config.get("firebase"));

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get("firebaseToken");
const UsersModule = require("../server/lib/users_module");
const DuelystFirebaseModule = require("../server/lib/duelyst_firebase_module");
const fbUtil = require('../app/common/utils/utils_firebase.js');

if (process.argv[2]) {

	console.log(process.argv);

	const email = process.argv[2];
	console.log("searching for user: " + email);
	console.log("hash: " + fbUtil.escapeEmail(email));

	UsersModule.userIdForEmail(email)
	.then(function(userId) {
		if (!userId) {
			throw new Error("userid not found");
		} else {
			console.log(`found user ... ${userId}`);
			return process.exit(1);
		}}).catch(function(error) {
		console.log(error);
		return process.exit(1);
	});

} else {
	throw new Error("no user email provided");
	process.exit(1);
}
