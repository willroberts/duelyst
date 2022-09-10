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

// auth firebase reference setup0
const fbAuthRef = new Firebase(config.get("auth"));
const authToken = config.get("authToken");
fbAuthRef.auth(authToken, function(error) {
	if (error) {
		console.log("Error authenticating against our user database.");
		return process.exit(1);
	}
});

const getAllEmails = cb => fbAuthRef.child('user').once('value', function(snapshot) {
    const data = snapshot.val();
    const emails = {};
    for (let user in data) {
        const {
            email
        } = data[user];
        emails[email] = user;
    }
    return cb(emails);
});

const createEmailIndex = function(email, id) {
	const escapedEmail = fbUtil.escapeEmail(email);
	return fbRef.child('email-index').child(escapedEmail).set(id, function(error) {
		if (error) {
			return console("Failed to set index for: " + email);
		} else {
			return console.log("Index created for: " + email);
		}
	});
};

const getAllUsernames = cb => fbAuthRef.child('user').once('value', function(snapshot) {
    const data = snapshot.val();
    const usernames = {};
    console.log(data);
    for (let user in data) {
        const {
            username
        } = data[user];
        usernames[username] = user;
    }
    return cb(usernames);
});

const createUsernameIndex = (username, id) => fbRef.child('username-index').child(username).set(id, function(error) {
    if (error) {
        return console("Failed to set index for: " + username);
    } else {
        return console.log("Index created for: " + username);
    }
});

getAllEmails(result => _.map(result, (id, email) => createEmailIndex(email, id)));

getAllUsernames(result => _.map(result, (id, username) => createUsernameIndex(username, id)));
