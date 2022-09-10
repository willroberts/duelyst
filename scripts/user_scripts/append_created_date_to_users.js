/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */


// region Requires
// Configuration object
const config = require("../../config/config.js");
const Firebase = require("firebase");
const _ = require("underscore");
const fbRef = new Firebase(config.get("firebase"));
const Promise = require('bluebird');
const colors = require('colors');
const moment = require('moment');

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get("firebaseToken");
const UsersModule = require("../../server/lib/users_module");
const DuelystFirebase= require("../../server/lib/duelyst_firebase_module");
const fbUtil = require('../../app/common/utils/utils_firebase.js');

// auth token and url
const firebaseAuthUrl = config.get("auth");
const firebaseAuthToken = config.get("authToken");

// reference to the last known user id
let last_user_id = null;
let has_started = false;

const updatePromises = [];

DuelystFirebase.connect(firebaseAuthUrl,firebaseAuthToken).getRootRef()
.bind({})
.then(function(fbAuthRef) {

	this.fbAuthRef = fbAuthRef;
	return DuelystFirebase.connect().getRootRef();}).then(function(fbRootRef) {

	// make sure auth is available to closures
	const {
        fbAuthRef
    } = this;

	return new Promise((resolve, reject) => fbRootRef.child('users').limitToLast(1).on('child_added', function(snapshot) {

        last_user_id = snapshot.key();
        console.log((`LAST USER ID: ${last_user_id.blue}`));

        if (!has_started) {
            has_started = true;
            return fbRootRef.child('users').on('child_added', function(snapshot) {

                const user_id = snapshot.key();
                const user_ref = snapshot.ref();

                if (snapshot != null ? snapshot.val().createdAt : undefined) {

                    console.log(`user ${user_id.blue} already has createdAt date`.yellow);
                    return resolve(user_id);

                } else {

                    const userUpdatePromise = new Promise(function(resolveUpdate,rejectUpdate){
                        console.log(`processing user ${user_id.blue}`.cyan);
                        return fbAuthRef.child('user').child(user_id).once('value', function(auth_user_snapshot) {
                            console.log(`found AUTH user ${user_id.blue}`);
                            if (auth_user_snapshot != null ? auth_user_snapshot.val() : undefined) {
                                let created_at = auth_user_snapshot.val().createdAt;
                                // if no created dat is known, set one
                                if (!created_at) {
                                    created_at = moment("2014-11-01").utc().valueOf();
                                    auth_user_snapshot.ref().update({createdAt:created_at});
                                    console.log(`need to estimate user ${user_id.blue}) created at ${created_at} date`.yellow);
                                }

                                return user_ref.update({createdAt:created_at},function(error){
                                    if (error) {
                                        return rejectUpdate(error);
                                    } else {
                                        console.log(`updated user ${user_id.blue}) with createdAt: ${created_at}`);
                                        return resolveUpdate(user_id);
                                    }
                                });
                            } else {
                                return rejectUpdate(new Error(`Could not find user ${user_id.blue} in AUTH database`));
                            }
                    });
                    });

                    updatePromises.push(userUpdatePromise);

                    // when we hit the last known user, resolve
                    if (user_id === last_user_id) {
                        return resolve(user_id);
                    }
                }
            });
        }
    }));}).then(function(user_id){

	console.log(`done looping through users (terminated at ${user_id.blue})... waiting for ${updatePromises.length} updates to finish`);
	return Promise.all(updatePromises);}).then(function(){

	console.log("ALL DONE!");
	return process.exit(1);}).catch(function(e){

	console.log(`ERROR: ${e.message}`.red);
	throw e;
	return process.exit(1);
});
