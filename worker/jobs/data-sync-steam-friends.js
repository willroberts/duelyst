/*
Job - Sync Steam Friends to Firebase buddies list
*/
const Promise = require('bluebird');
const Firebase = require('firebase');
const DuelystFirebase = require('../../server/lib/duelyst_firebase_module');
const config = require('../../config/config');
const UsersModule = require('../../server/lib/data_access/users');
const SyncModule = require('../../server/lib/data_access/sync');
const Logger = require('../../app/common/logger');

/**
 * @param	{Object} job		Kue job
 * @param	{Function} done 	Callback when job is complete
 */
module.exports = function(job, done) {
	const userId = job.data.userId || null;
	const friendsSteamIds = job.data.friendsSteamIds || [];
	if (!userId) {
		return done(new Error("User ID is not defined."));
	}

	Logger.module("JOB").debug(`[J:${job.id}] syncing user (${userId}) steam's friends`);
	// Logger.module("JOB").time("[J:#{job.id}] synced user (#{userId}) steam friends")

	// Exit out early if array is empty
	if (friendsSteamIds.length === 0) {
		return done();
	}

	// Create an array of promises returning user ids
	const friendsUserIds = friendsSteamIds.map(steamId => UsersModule.userIdForSteamId(steamId));
	
	return DuelystFirebase.connect().getRootRef()
	.bind({})
	.then(function(fbRootRef) {
		this.fbRootRef = fbRootRef;
		// Map the array of friends, check for null explicility
		return Promise.map(friendsUserIds, friendUserId => {
			if (friendUserId === null) {
				return Promise.resolve();
			} else {
				Logger.module("JOB").debug(`[J:${job.id}] steam friending ${userId} to ${friendUserId}`);
				const myBuddiesRef = this.fbRootRef.child(`users/${userId}/buddies`);
				myBuddiesRef.child(friendUserId).set({
					createdAt: Firebase.ServerValue.TIMESTAMP
				});
				const theirBuddiesRef = this.fbRootRef.child(`users/${friendUserId}/buddies`);
				theirBuddiesRef.child(userId).set({
					createdAt: Firebase.ServerValue.TIMESTAMP
				});
				return Promise.resolve();
			}
		});}).then(() => // Logger.module("JOB").timeEnd("[J:#{job.id}] synced user (#{userId}) steam friends")
    done()).catch(error => done(error));
};
