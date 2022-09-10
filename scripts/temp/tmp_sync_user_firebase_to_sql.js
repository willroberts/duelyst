/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * DS209: Avoid top-level return
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// env $(cat .env_for_alpha | xargs) coffee ./scripts/temp/tmp_sync_user_firebase_to_sql.coffee 

require('coffee-script/register');
const knex = require("../../server/lib/data_access/knex");
const SyncModule = require("../../server/lib/data_access/sync");
const DuelystFirebase= require("../../server/lib/duelyst_firebase_module");
const FirebasePromises = require("../../server/lib/firebase_promises");
const _ = require('underscore');
const Promise = require('bluebird');
const ProgressBar = require('progress');
const Logger = require('../../app/common/logger');
const Errors = require("../../server/lib/custom_errors");
const config = require('../../config/config');
const moment = require('moment');

Logger.enabled = false;

if ((process.env.NODE_ENV == null)) {
	throw new Error("NODE_ENV must be defined");
}

console.time("ALL DONE");

const srcFirebase = process.env.SRC_FIREBASE;
const srcFirebaseSecret = process.env.SRC_FIREBASE_SECRET;

if ((srcFirebase == null)) {
	throw new Error("SRC_FIREBASE must be defined");
}

if ((srcFirebaseSecret == null)) {
	throw new Error("SRC_FIREBASE_SECRET must be defined");
}

const firebaseAuthToken = config.get('authToken');
const firebaseAuthUrl = config.get('auth');

const thisObj = {};

console.log(`FROM ${srcFirebase} =====> ${config.get('firebase')}`);

return Promise.all([
	DuelystFirebase.connect(firebaseAuthUrl,firebaseAuthToken).getRootRef(),
	DuelystFirebase.connect(srcFirebase,srcFirebaseSecret).getRootRef(),
	DuelystFirebase.connect().getRootRef(),
])
.bind(thisObj)
.spread(function(authRef,rootRef,destinationRootRef){

	this.authRef = authRef;
	this.rootRef = rootRef;
	this.destinationRootRef = destinationRootRef;
// 	console.log("loading invite codes... ")
// 	console.time("loaded all invite codes")
// 	return FirebasePromises.once(@.rootRef.child('invite-codes').child('active'),'value')

// .then (inviteCodesSnapshot)->

// 	console.timeEnd("loaded all invite codes")

// 	activeCodes = inviteCodesSnapshot.val()

// 	bar = new ProgressBar('importing invite codes [:bar] :percent :etas', {
// 	    complete: '=',
// 	    incomplete: ' ',
// 	    width: 20,
// 	    total: _.keys(activeCodes).length
// 	})

// 	return Promise.map(_.keys(activeCodes),(code)->
// 		return knex("invite_codes").insert({
// 			code:		code,
// 			created_at:	moment.utc(activeCodes[code].created_at).toDate()
// 		}).then ()->
// 			bar.tick()
// 	,{concurrency:10})

// .then ()->

	console.log("loading all users... ");
	console.time("loaded all users");
	return FirebasePromises.once(this.rootRef.child('username-index'),'value');}).then(snapshot => _.values(snapshot.val())).then(function(userIds){

	let limit = Math.min(1000000,userIds.length);
	const allUserIds = userIds;
	// console.timeEnd("loaded all users")
	console.log(`${allUserIds.length} users found`);

	const bar = new ProgressBar('importing users [:bar] :percent :etas', {
	    complete: '=',
	    incomplete: ' ',
	    width: 20,
	    total: limit
	});

	const {
        authRef
    } = this;
	const {
        rootRef
    } = this;
	const {
        destinationRootRef
    } = this;

	return Promise.map(allUserIds,function(userId){
		if (limit > 0) {
			return SyncModule._syncUserFromFirebaseToSQL(authRef,rootRef,userId)
			.bind(thisObj)
			.then(function(userData){
				if (userData.username) {
					return FirebasePromises.set(this.destinationRootRef.child('users').child(userId).child('presence'),{
						username:userData.username,
						began:moment().utc().valueOf(),
						status:'offline',
						portrait_id:userData.portrait_id || null
					});
				}}).catch(Errors.AlreadyExistsError, e => console.log((`user ${userId} already synced`))).catch(e => console.log(`ERROR on ${userId} ... `,e)).finally(function(){
				if (bar != null) {
					bar.tick();
				}
				return limit--;
			});
		} else {
			return Promise.resolve(true);
		}
	}
	,{concurrency:20});}).then(function(){

	console.timeEnd("ALL DONE");
	return process.exit(1);}).catch(function(error){

	throw error;
});