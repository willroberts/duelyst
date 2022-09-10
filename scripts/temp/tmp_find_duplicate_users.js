/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
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
const moment = require('moment');
const fbUtil = require('../../app/common/utils/utils_firebase.js');

Logger.enabled = false;

console.time("ALL DONE");

const thisObj = {};

return Promise.all([
	DuelystFirebase.connect().getRootRef(),
])
.bind(thisObj)
.spread(function(rootRef,destinationRootRef){

	return this.rootRef = rootRef;}).then(function(){

// 	console.log("loading all users... ")
// 	console.time("loaded all users")
// 	return FirebasePromises.once(@.rootRef.child('username-index'),'value')

// .then (snapshot)->
	
// 	return _.values(snapshot.val())

	const suspectedDupes = ["-JrsVU-Zmevn0Dkp0xE6","-Juy0FMHW-RXj_98Xdj6","-JqzzOlrKuk16Is64Hks","-JlBwkW0OQxt6jIJVBzw","-JqzyXksWKhf8nJK6c-b","-JyAMvmWt8p6lA1_CwR6","-Juy0FLwEXke-LBPMUya","-JoAatUPCWodYSRCSccZ","-Js06Q9fpF3rdKLyOcmc","-JpcRiw1x_pkQfdXDDBq","-JgxiBFwrp7xwaWlP7me","-Jqzy-y2KAIRt-BHHroX","-Jqzxy_-9nf9okANMmdj","-Juy0FG6HQl8fE7l_K8z","-Juy0FEKay4J95K8Gz9_","-JxHRhGA_5UHSwHBOhJ9","-JjHczzCPPyr5D7x276U","-JlH5TNojLc7M1qlhEDS","-JzNeN2GWuwM-5pYN2EU","-JqzzBhe58VL6ZNd1S7k","-Jy1p1tdMPqi6y2IVm1X","-JlBwkWo5aY8f0Sfkogs","-JlQh3v7KU1wupxwdliT"];
	return suspectedDupes;}).then(function(userIds){

	const allUserIds = userIds;
	let limit = allUserIds.length; // Math.min(10000,userIds.length)
	console.log(`${allUserIds.length} users found`);

	// bar = new ProgressBar('importing users [:bar] :percent :etas', {
	//     complete: '=',
	//     incomplete: ' ',
	//     width: 20,
	//     total: limit
	// })

	const {
        rootRef
    } = this;

	return Promise.map(allUserIds,function(userId){
		if (limit > 0) {
			return FirebasePromises.once(rootRef.child('users').child(userId).child('email'),'value')
			.bind({})
			.then(function(emailSnapshot){
				const email = (this.email = emailSnapshot.val());
				const escaped = fbUtil.escapeEmail(email);
				// console.log "found email #{email} #{escaped}"
				return FirebasePromises.once(rootRef.child('email-index').child(escaped),'value');}).then(function(idSnapshot){
				if (idSnapshot.val() !== userId) {
					this.realUserId = idSnapshot.val();
					return Promise.all([
						FirebasePromises.once(rootRef.child('users').child(userId).child('presence'),'value'),
						FirebasePromises.once(rootRef.child('users').child(this.realUserId).child('presence'),'value')
					])
					.bind(this)
					.spread(function(suspectedUserPresence,realUserPresence){
						const lastSuspectedSeen = __guard__(suspectedUserPresence.val(), x => x.began) ? moment.utc(__guard__(suspectedUserPresence.val(), x1 => x1.began)).format("MM-DD") : null;
						const lastRealSeen = __guard__(realUserPresence.val(), x2 => x2.began) ? moment.utc(__guard__(realUserPresence.val(), x3 => x3.began)).format("MM-DD") : null;
						console.log(`user ${userId.blue} is using dupe email ${this.email.cyan} that points to ${this.realUserId.green}`);
						return console.log(`user ${userId.blue} last seen on ${lastSuspectedSeen}. user ${this.realUserId.green} last seen on ${lastRealSeen}`);
					});
				}}).catch(e => console.log("ERROR",e)).finally(() => // bar?.tick()
            limit--);
		} else {
			return Promise.resolve(true);
		}
	}
	,{concurrency:20});}).then(function(){

	console.timeEnd("ALL DONE");
	return process.exit(1);}).catch(function(error){

	throw error;
});
function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}