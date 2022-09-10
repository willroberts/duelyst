/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

/*

	retrieve_game_data - retrieves game data from s3


	Examples: (no parameters required)
  retrieve_game_data environment gameId


*/

// region Requires
// Configuration object
const config = require("../../config/config.js");
const Promise = require('bluebird');
const _ = require("underscore");
const request 	= require('request');

// endregion Requires

// example url:
//https://s3-us-west-1.amazonaws.com/duelyst-games/staging/170.json

// Resolves to a results object filled with data representing the results of the wipe
const retrieve_game_data = (environment, gameId) => new Promise( (resolve, reject) => //        request.get("https://s3-us-west-1.amazonaws.com/duelyst-games/staging/170.json").type('application/json').accept('application/json').end (err, res) ->
request(
    "https://s3-us-west-1.amazonaws.com/duelyst-games/"+environment+"/"+gameId+".json",
    function(err, res, body) {
        if ((res != null) && (res.status >= 400)) {
            // Network failure, we should probably return a more intuitive error object
            Logger.module("CONSUL").log(`ERROR! Failed to connect to Consul: ${res.status} `.red);
            return reject(new Error("Failed to connect to Consul."));
        } else if (err) {
            // Internal failure
            Logger.module("CONSUL").log(`ERROR! getHealthyServers() failed: ${err.message} `.red);
            return reject(err);
        } else {
            return resolve(body);
        }
    }
));

if (process.argv[2] && process.argv[3]) {
	retrieve_game_data(process.argv[2],process.argv[3])
	.then(data => console.log(JSON.stringify(JSON.parse(data),null,2)));
} else {
	console.log("Incorrect usage.  Usage: coffee retrieve_gama_data 'env' 'game_id'");
}



