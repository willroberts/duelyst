/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Firebase = require('firebase');
const _ = require('underscore');
const fbUtil = require('../../app/common/utils/utils_firebase.js');
const config = require('../../config/config.js');

// main firebase reference setup
const fbRef = new Firebase(config.get("firebase"));
const firebaseToken = config.get("firebaseToken");
fbRef.auth(firebaseToken, function(error) {
	if (error) {
		console.log("Error authenticating against our database.");
		return process.exit(1);
	}
});

// auth firebase reference setup
const fbAuthRef = new Firebase(config.get("auth"));
const authToken = config.get("authToken");
fbAuthRef.auth(authToken, function(error) {
	if (error) {
		console.log("Error authenticating against our user database.");
		return process.exit(1);
	}
});

const getAllUsernames = cb => fbRef.child('users').once('value', function(snapshot) {
    const data = snapshot.val();
    const usernames = {};
    for (let user in data) {
        const {
            username
        } = data[user];
        usernames[username] = user;
    }
    return cb(usernames);
});

const addUsername = (id, username) => fbAuthRef.child('user').child(id).child('username').set(username, function(error) {
    if (error) {
        return console.log(`Failed to set username for ${id}:${username}`);
    } else {
        return console.log(`Username updated for ${id}:${username}`);
    }
});

getAllUsernames(result => _.map(result, (id, username) => addUsername(id,username)));
