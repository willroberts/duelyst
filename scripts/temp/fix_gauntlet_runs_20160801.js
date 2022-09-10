/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Promise = require("bluebird");
const PrettyError = require('pretty-error');
const ProgressBar = require('progress');
const _ = require('underscore');

const path = require('path');
require('app-module-path').addPath(path.join(__dirname, '../../'));
const SDK = require('app/sdk');
const knex = require("server/lib/data_access/knex");
const GauntletModule = require("server/lib/data_access/gauntlet");
const InventoryModule = require("server/lib/data_access/inventory");
const UsersModule = require("server/lib/data_access/users");

// configure pretty error
const prettyError = new PrettyError();
prettyError.skipNodeFiles();
prettyError.skipPackage('bluebird');

console.log("loading gauntlet runs...");
knex("user_gauntlet_run").select('user_id','deck','is_resigned','created_at').whereNotNull('deck')
.then(function(gauntletRuns){

	console.log(`loaded ${gauntletRuns.length} gauntlet runs`);
	// bar = new ProgressBar('processing [:bar] :percent :etas', {
	// 	complete: '=',
	// 	incomplete: ' ',
	// 	width: 20,
	// 	total: parseInt(gauntletRuns.length)
	// })

	gauntletRuns = _.filter(gauntletRuns, run => _.find(run.deck, cardId => parseInt(cardId) === SDK.Cards.Neutral.BloodTaura));

	console.log(`${gauntletRuns.length} gauntlet runs have TAURA`);

	return Promise.map(gauntletRuns, function(gauntletRun){
		// bar.tick()
		const hasTaura = _.find(gauntletRun.deck, cardId => parseInt(cardId) === SDK.Cards.Neutral.BloodTaura);
		if (hasTaura) {
			console.log(`HAS TAURA! ${gauntletRun.user_id} started on ${gauntletRun.created_at}`);
			if (!gauntletRun.is_resigned) {
				console.log(`resigning run for ${gauntletRun.user_id}`);
				return GauntletModule.resignRun(gauntletRun.user_id).then(function(){
					console.log(`Resigned. Adding gauntlet ticket to ${gauntletRun.user_id}`);
					return knex.transaction(tx => GauntletModule.addArenaTicketToUser(Promise.resolve(),tx,gauntletRun.user_id,"crm"));
				});
			}
		} else {
			return Promise.resolve();
		}
	}
	,{concurrency: 1});})
.then(() => console.log("done")).catch(function(e){
	console.log(`ERROR! ${e.message}`);
	console.log(prettyError.render(e));
	throw e;
	return process.exit(1);
});