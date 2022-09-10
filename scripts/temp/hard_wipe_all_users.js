/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

const UsersModule = require("../../server/lib/data_access/users");
const knex = require("../../server/lib/data_access/knex");
const DuelystFirebase= require("../../server/lib/duelyst_firebase_module");
const Promise = require("bluebird");

knex("users").select().then(function(userRows){
	const allPromises = [];
	for (let row of Array.from(userRows)) {
		allPromises.push(UsersModule.___hardWipeUserData(row.id));
	}
	return Promise.all(allPromises);}).then(function(){
	console.log("all done...");
	return process.exit(1);}).catch(function(err){
	throw err;
	console.log("ERROR",err);
	return process.exit(1);
});