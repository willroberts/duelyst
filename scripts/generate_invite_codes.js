/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

// Configuration object
const config = require("../config/config.js");
const Firebase = require("firebase");
const _ = require("underscore");
const fbRef = new Firebase(config.get("firebase"));

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get("firebaseToken");
const DuelystFirebase= require("../server/lib/duelyst_firebase_module");
const fbUtil = require('../app/common/utils/utils_firebase.js');
const Promise = require('bluebird');
const uuid = require('node-uuid');

console.log(process.argv);

let count = process.argv[2] || 10;
count = parseInt(count);
console.log(`generating ${count} codes`);

DuelystFirebase.connect().getRootRef()
.bind({})
.then(function(fbRootRef) {
	const promises = [];
	for (let i = 1, end = count, asc = 1 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
		const promise = new Promise(function(resolve,reject) {
			const id = uuid.v4();
			const newCode = fbRootRef.child("invite-codes").child('active').child(id);
			return newCode.setWithPriority({created_at:Firebase.ServerValue.TIMESTAMP}, Firebase.ServerValue.TIMESTAMP, function(error) {
				if (error) {
					return reject(error);
				} else {
					return resolve(newCode.key());
				}
			});
		});
		promises.push(promise);
	}

	return Promise.all(promises);}).then(function(results) {
	console.log("All done.");
	for (let result of Array.from(results)) {
		console.log(result);
	}
	return process.exit(1);}).catch(function(error) {
	console.log(error);
	return process.exit(1);
});
