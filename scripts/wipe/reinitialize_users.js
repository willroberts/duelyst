/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Firebase = require('firebase');
const _ = require('underscore');
const Promise = require('bluebird');
const fbUtil = require('../../app/common/utils/utils_firebase.js');
const config = require('../../config/config.js');
const UsersModule = require('../../server/lib/users_module');

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

const buddyLists = {};

const fbRef_saveBuddyLists = cb => fbRef.child('users').once('value', function(snapshot) {
    const data = snapshot.val();
    for (let user in data) {
        const {
            id
        } = data[user];
        const {
            buddies
        } = data[user];
        if (buddies) {
            buddyLists[id] = buddies;
        }
    }
    return cb();
});

const fbRef_wipeRoot = cb => fbRef.remove(() => cb());

const fbRef_wipeUsers = cb => fbRef.child('users').remove(() => cb());

const fbRef_setupProfile = (id, email, username) => new Promise(function(resolve, reject) {
    const profile_data = {
        id,
        email,
        username,
        dateJoined: new Date(),
        winCount: 0,
        lossCount: 0,
        presence: {
            username,
            status: "offline"
        }
    };
    const userRef = fbRef.child('users').child(id);
    return userRef.setWithPriority(profile_data, email, function(error) {
        if (error) {
            return reject(new Error('Firebase error: creating profile failed.'));
        } else {
            return resolve();
        }
    });
});

const fbRef_setupUser = function(id, email, username) {
	const setup = [];
	setup.push(fbRef_setupProfile(id,email,username));
	setup.push(UsersModule.cycleUserSeasonRanking(id));
	setup.push(UsersModule.initializeWallet(id));
	return Promise.all(setup);
};

const fbRef_restoreBuddyLists = id => new Promise(function(resolve, reject) {
    if (!buddyLists[id]) {
        return resolve();
    }

    const buddies = buddyLists[id];
    return fbRef.child('users').child(id).child('buddies').set(buddies, function(error) {
        if (error) {
            return reject(new Error('Firebase error: buddy list setup failed.'));
        } else {
            return resolve();
        }
    });
});

const authRef_getAllUsers = cb => fbAuthRef.child('user').on('child_added', function(snapshot) {
    const data = snapshot.val();
    const key = snapshot.key();
    // If no username exists, ignore it
    if (data.username) {
        return cb(key, data);
    }
});

fbRef_saveBuddyLists(() => fbRef_wipeRoot(() => authRef_getAllUsers(function(key, data) {
    console.log(`User ${data.email} initializing.`);
    return fbRef_setupUser(key, data.email, data.username)
    .then(function() {
        console.log(`User ${data.email} initialized.`);
        return fbRef_restoreBuddyLists(key);}).catch(function(e) {
        console.log(`User ${data.email} initialization failed!`);
        return console.error(e);
    });
})));
