/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const _ = require('underscore');
const util = require('util');
const SDK = require('../../app/sdk');
const knex = require("../../server/lib/data_access/knex");
const Promise = require('bluebird');
const UsersModule = require("../../server/lib/data_access/users");
const RankModule = require("../../server/lib/data_access/rank");
const GamesModule = require("../../server/lib/data_access/games");
const generatePushId = require("../../app/common/generate_push_id");
const {Redis, Jobs, GameManager} = require('../../server/redis/');
const GameType = require('../../app/sdk/gameType');
const GameSetup = require('../../app/sdk/gameSetup');

// Update User Ranking, Progression, Quests, Stats
const updateUser = function(gameSession, userId, gameId, factionId, isWinner, isDraw) {

	// check for isFriendly
	// check for isUnscored
	const isFriendly = gameSession.isFriendly();
	const isUnscored = false;

	console.log("starting job...");

	// start the job to process the game for a user
	return Jobs.create("update-user-post-game", {
		name: "Update User Game",
		title: util.format("User %s :: Game %s", userId, gameId),
		userId,
		gameId,
		gameType: gameSession.gameType,
		factionId,
		isWinner,
		isDraw,
		isUnscored
	}
	).removeOnComplete(true).save();
};

const startAGame = function(){

	console.log("starting game...");

	const users = _.sample(userIds,2);
	if (_.contains(usersInGame,users[0]) || _.contains(usersInGame,users[1])) {
		// startAGame()
		return;
	}

	console.log(`started game for ${users}`);

	// mark users as in-game
	usersInGame.push(users[0]);
	usersInGame.push(users[1]);

	// set up game session
	const gs = SDK.GameSession.create();
	gs.setIsRunningAsAuthoritative(true);
	gs.gameId = generatePushId();
	gs.gameType = GameType.Ranked;
	GameSetup.setupNewSession(gs,{userId:users[0],deck:[1,9,9,9]},{userId:users[1],deck:[1,9,9,9]});

	// resign
	const player = gs.getPlayerById(users[1]);
	const resignAction = player.actionResign();
	gs.executeAction(resignAction);

	const data = gs.serializeToJSON();

	return GameManager.saveGameSession(gs.gameId,data).then(function(){

		let usersInGame;
		updateUser(gs,users[0],gs.gameId,1,true,false);
		updateUser(gs,users[1],gs.gameId,1,false,false);

		return usersInGame = _.without(usersInGame,[users[0],users[1]]);
	});
};

var userIds = [];
var usersInGame = [];

knex("users").select('id').where('username', 'like', '%unit-test%').then(function(ids){
	console.log("fetched user IDs");
	userIds = _.map(ids,userRow => userRow.id);
	return setInterval(startAGame,300);
});
