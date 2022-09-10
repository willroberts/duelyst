/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Promise = require('bluebird');
const util = require('util');
const FirebasePromises = require('../firebase_promises');
const DuelystFirebase = require('../duelyst_firebase_module');
const fbUtil = require('../../../app/common/utils/utils_firebase.js');
const Logger = require('../../../app/common/logger.coffee');
const colors = require('colors');
const uuid = require('node-uuid');
const moment = require('moment');
const _ = require('underscore');
const CONFIG = require('../../../app/common/config.js');
const Errors = require('../custom_errors');
const mail = require('../../mailer');
const knex = require("../data_access/knex");
const config = require('../../../config/config.js');
const generatePushId = require('../../../app/common/generate_push_id');
const DataAccessHelpers = require('./helpers');
Promise.promisifyAll(mail);

// SDK imports
const SDK = require('../../../app/sdk');
const QuestFactory = require('../../../app/sdk/quests/questFactory');
const QuestType = require('../../../app/sdk/quests/questTypeLookup');
const UtilsGameSession = require('../../../app/common/utils/utils_game_session.coffee');
const CosmeticsLookup = require('../../../app/sdk/cosmetics/cosmeticsLookup');

// redis
const {SRankManager} = require('../../redis/');

class SyncModule {

	/**
	 * Mark user's firebase data with a version string
	 * @private
	 * @param	{String}			userId		User ID
	 * @param	{String}			hash		Hash string
	 * @return	{Promise}						Promise that will resolve on completion.
	 */
	static _bumpUserTransactionCounter(tx,userId){

		return Promise.all([
			knex("users").increment("tx_count",1).where('id',userId).transacting(tx),
			DuelystFirebase.connect().getRootRef().then(function(rootRef){
				const updateVersion = function(counter){
					if (counter == null) { counter = {}; }
					if (counter.count == null) { counter.count = 0; }
					counter.count += 1;
					return counter;
				};
				return FirebasePromises.safeTransaction(rootRef.child('users').child(userId).child('tx_counter'),updateVersion);
			})
		]);
	}

	/**
	 * Check a user's transaction counter, and sync data to Firebase if tx count not equal.
	 * @public
	 * @param	{String}	userId				User ID.
	 * @return	{Promise}						Promise that will resolve on completion
	 */
	static syncUserDataIfTrasactionCountMismatched(userId){

		return DuelystFirebase.connect().getRootRef()
		.bind({})
		.then(function(fbRootRef){
			this.fbRootRef = fbRootRef;
			return Promise.all([
				knex.first('tx_count').from('users').where('id',userId),
				FirebasePromises.once(this.fbRootRef.child('users').child(userId).child('tx_counter').child('count'),'value')
			]);}).spread(function(userRow,txCountSnapshot){

			this.firebaseTxCount = txCountSnapshot.val();
			let shouldSyncBuddyList = false;

			// if there is NO transaction count value, sync the buddy list to the one last known in the DB
			// the assumption is that the user record is missing all together and needs a buddy list sync
			if ((this.firebaseTxCount == null)) {
				shouldSyncBuddyList = true;
			}

			if (!userRow) {
				throw new Errors.NotFoundError("Could not find user");
			}

			if (userRow.tx_count !== this.firebaseTxCount) {
				this.needsSync = true;
				return SyncModule._syncUserFromSQLToFirebase(userId,shouldSyncBuddyList);
			} else {
				return this.needsSync = false;
			}}).then(function(){

			if (this.needsSync) {
				Logger.module("SyncModule").log(`syncUserDataIfTrasactionCountMismatched() -> ${userId} syncing: ${this.needsSync}`.green);
			}

			return this.needsSync;
		});
	}

	/**
	 * Wipe user data.
	 * @public
	 * @param	{String}	userId				User ID.
	 * @return	{Promise}						Promise that will resolve on completion
	 */
	static wipeUserData(userId){

		Logger.module("SyncModule").time(`wipeUserData() -> ${userId.blue} wiped`);

		return DuelystFirebase.connect().getRootRef()
		.bind({})
		.then(function(fbRootRef){
			this.fbRootRef = fbRootRef;

			return knex("user_rank_ratings").where('user_id',userId).select("season_starting_at");}).then(userRatingsRows => // User needs to be removed from redis for each season they have a rating for
        Promise.map(userRatingsRows, function(ratingRow) {
            const startOfSeasonMoment = moment.utc(ratingRow.season_starting_at);
            return SRankManager._removeUserFromLadder(userId,startOfSeasonMoment);
        })).then(function() {

			const {
                fbRootRef
            } = this;

			const allPromises = [
				FirebasePromises.remove(fbRootRef.child('user-transactions').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-inventory').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-logs').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-quests').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-ranking').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-aggregates').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-decks').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-games').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-progression').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-faction-progression').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-challenge-progression').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-gauntlet-run').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-news').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-matchmaking-errors').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-stats').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-rewards').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-achievements').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-ribbons').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-purchase-counts').child(userId)),
				FirebasePromises.remove(fbRootRef.child('user-rift-runs').child(userId)),
				FirebasePromises.update(fbRootRef.child('users').child(userId),{
					ltv:0,
					total_orb_count_set_3: 0,
					rift_stored_upgrade_count: 0,
					free_card_of_the_day_claimed_at: null
				}),

				knex("user_rank_events").where('user_id',userId).delete(),
				knex("user_rank_history").where('user_id',userId).delete(),
				knex("user_charges").where('user_id',userId).delete(),
				knex("user_gauntlet_run").where('user_id',userId).delete(),
				knex("user_gauntlet_run_complete").where('user_id',userId).delete(),
				knex("user_gauntlet_tickets").where('user_id',userId).delete(),
				knex("user_gauntlet_tickets_used").where('user_id',userId).delete(),
				knex("user_spirit_orbs").where('user_id',userId).delete(),
				knex("user_spirit_orbs").where({'user_id':'some-other-test-user'}).delete(),
				knex("user_spirit_orbs_opened").where('user_id',userId).delete(),
				knex("user_cards").where('user_id',userId).delete(),
				knex("user_card_log").where('user_id',userId).delete(),
				knex("user_card_collection").where('user_id',userId).delete(),
				knex("user_currency_log").where('user_id',userId).delete(),
				knex("user_decks").where('user_id',userId).delete(),
				knex("user_games").where('user_id',userId).delete(),
				knex("user_progression").where('user_id',userId).delete(),
				knex("user_progression_days").where('user_id',userId).delete(),
				knex("user_faction_progression").where('user_id',userId).delete(),
				knex("user_faction_progression_events").where('user_id',userId).delete(),
				knex("user_quests").where('user_id',userId).delete(),
				knex("user_quests_complete").where('user_id',userId).delete(),
				knex("user_rewards").where('user_id',userId).delete(),
				knex("user_new_player_progression").where('user_id',userId).delete(),
				knex("user_challenges").where('user_id',userId).delete(),
				// knex("user_emotes").where('user_id',userId).delete(),
				knex("user_achievements").where('user_id',userId).delete(),
				knex("user_game_counters").where('user_id',userId).delete(),
				knex("user_game_faction_counters").where('user_id',userId).delete(),
				knex("user_game_general_counters").where('user_id',userId).delete(),
				knex("user_game_season_counters").where('user_id',userId).delete(),
				knex("user_ribbons").where('user_id',userId).delete(),
				knex("user_referrals").where('user_id',userId).delete(),
				knex("user_referral_events").where('referrer_id',userId).delete(),
				knex("user_rank_ratings").where('user_id',userId).delete(),
				knex("user_codex_inventory").where('user_id',userId).delete(),
				knex("user_daily_challenges_completed").where('user_id',userId).delete(),
				knex("user_card_lore_inventory").where('user_id',userId).delete(),
				knex("user_cosmetic_chests").where('user_id',userId).delete(),
				knex("user_cosmetic_chests_opened").where('user_id',userId).delete(),
				knex("user_cosmetic_chest_keys").where('user_id',userId).delete(),
				knex("user_cosmetic_chest_keys_used").where('user_id',userId).delete(),
				knex("user_cosmetic_inventory").where('user_id',userId).delete(),
				knex("gift_codes").where('claimed_by_user_id',userId).delete(),
				knex("user_gift_crates").where('user_id',userId).delete(),
				knex("user_rift_runs").where('user_id',userId).delete(),
				knex("user_rift_tickets").where('user_id',userId).delete(),
				knex("user_rift_tickets_used").where('user_id',userId).delete(),
				knex("user_rift_run_stored_upgrades").where('user_id',userId).delete(),
				// knex("user_buddies").where('user_id',userId).delete(),
				knex("users").where('id',userId).update({
					last_purchase_at:null,
					purchase_count:0,
					ltv:0,
					rank:30,
					rank_created_at:null,
					rank_starting_at:null,
					rank_stars:0,
					rank_stars_required:1,
					rank_updated_at:null,
					rank_win_streak:0,
					rank_top_rank:null,
					rank_is_unread:false,
					top_rank:null,
					top_rank_starting_at:null,
					top_rank_updated_at:null,
					wallet_gold:0,
					wallet_spirit:0,
					wallet_cores:0,
					wallet_updated_at:null,
					total_gold_earned:0,
					total_spirit_earned:0,
					daily_quests_generated_at:null,
					daily_quests_updated_at:null,
					stripe_customer_id:null,
					username_updated_at:null,
					referred_by_user_id:null,
					referral_rewards_claimed_at:null,
					referral_rewards_updated_at:null,
					top_rank_ladder_position:null,
					top_rank_rating:null,
					is_bot:false,
					last_retention_gift_at:null,
					soft_wipe_count:0,
					last_soft_twipe_at:null,
					first_purchased_at:null,
					has_purchased_starter_bundle:null,
					steam_id:null,
					steam_associated_at:null,
					portrait_id: null,
					total_orb_count_set_3: 0,
					total_orb_count_set_4: null,
					free_card_of_the_day_claimed_at: null,
					free_card_of_the_day_claimed_count: 0,
					rift_stored_upgrade_count: 0
				})
			];

			const referralCode = typeof referralCodeRow !== 'undefined' && referralCodeRow !== null ? referralCodeRow.code : undefined;
			if (referralCode != null) {
				allPromises.push(knex("referral_events").where('code',referralCode).delete());
			}

			return Promise.all(allPromises);}).then(() => Logger.module("SyncModule").timeEnd(`wipeUserData() -> ${userId.blue} wiped`));
	}
	// ###*
	// # Completely remove all user data from DB and Firebase.
	// # @private
	// # @param	{String}	userId				User ID.
	// # @return	{Promise}						Promise that will resolve on completion
	// ###
	// @destroyUserData: (userId)->

	// 	return DuelystFirebase.connect().getRootRef()
	// 	.bind {}
	// 	.then (fbRootRef)->
	// 		return Promise.all([
	// 			FirebasePromises.remove(fbRootRef.child('user-transactions').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-inventory').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-logs').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-quests').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-ranking').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-aggregates').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-decks').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-games').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-progression').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-faction-progression').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-challenge-progression').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-gauntlet-run').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-news').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-matchmaking-errors').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-stats').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-rewards').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('user-achievements').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('users').child(userId)),
	// 			FirebasePromises.remove(fbRootRef.child('username-index').child(userId)),

	// 			knex("user_rank_events").where('user_id',userId).delete(),
	// 			knex("user_rank_history").where('user_id',userId).delete(),
	// 			knex("user_charges").where('user_id',userId).delete(),
	// 			knex("user_gauntlet_run").where('user_id',userId).delete(),
	// 			knex("user_gauntlet_run_complete").where('user_id',userId).delete(),
	// 			knex("user_gauntlet_tickets").where('user_id',userId).delete(),
	// 			knex("user_gauntlet_tickets_used").where('user_id',userId).delete(),
	// 			knex("user_spirit_orbs").where('user_id',userId).delete(),
	// 			knex("user_spirit_orbs").where({'user_id':'some-other-test-user'}).delete(),
	// 			knex("user_spirit_orbs_opened").where('user_id',userId).delete(),
	// 			knex("user_cards").where('user_id',userId).delete(),
	// 			knex("user_card_log").where('user_id',userId).delete(),
	// 			knex("user_card_collection").where('user_id',userId).delete(),
	// 			knex("user_currency_log").where('user_id',userId).delete(),
	// 			knex("user_decks").where('user_id',userId).delete(),
	// 			knex("user_games").where('user_id',userId).delete(),
	// 			knex("user_progression").where('user_id',userId).delete(),
	// 			knex("user_progression_days").where('user_id',userId).delete(),
	// 			knex("user_faction_progression").where('user_id',userId).delete(),
	// 			knex("user_faction_progression_events").where('user_id',userId).delete(),
	// 			knex("user_quests").where('user_id',userId).delete(),
	// 			knex("user_quests_complete").where('user_id',userId).delete(),
	// 			knex("user_rewards").where('user_id',userId).delete(),
	// 			knex("user_new_player_progression").where('user_id',userId).delete(),
	// 			knex("user_challenges").where('user_id',userId).delete(),
	// 			knex("user_emotes").where('user_id',userId).delete(),
	// 			knex("user_achievements").where('user_id',userId).delete(),
	//			knex("user_game_counters").where('user_id',userId).delete(),
	//			knex("user_game_faction_counters").where('user_id',userId).delete(),
	//			knex("user_game_season_counters").where('user_id',userId).delete(),
	//			knex("user_buddies").where('user_id',userId).delete(),
	// 			knex("users").where('id',userId).delete()
	// 		])

	/**
	 * Sync a user's buddy list from Firebase to SQL. This is inteded to be used periodically as a job (such as on login)
	 * @private
	 * @param	{String}	userId				User ID.
	 * @return	{Promise}						Promise that will resolve on completion
	 */
	static syncBuddyListFromFirebaseToSQL(userId){

		Logger.module("SyncModule").time("syncBuddyListFromFirebaseToSQL() -> start");

		const MOMENT_NOW_UTC = moment().utc();

		return DuelystFirebase.connect().getRootRef()
		.then(function(fbRootRef) {
			Logger.module("SyncModule").time("syncBuddyListFromFirebaseToSQL() -> loading...");
			return FirebasePromises.once(fbRootRef.child("users").child(userId).child('buddies'),"value");}).then(buddiesSnapshot => Promise.all([
            knex("user_buddies").where('user_id',userId).select(),
            buddiesSnapshot.val()
        ])).spread(function(buddyRows,buddies){

			if (((buddyRows != null ? buddyRows.length : undefined) > 0) || (buddies != null)) {

				let buddy;
				const allPromises = [];
				for (buddy in buddies) {
					const obj = buddies[buddy];
					if (!_.find(buddyRows,row => row.buddy_id === buddy)) {
						allPromises.push(knex("user_buddies").insert({
							'user_id':userId,
							'buddy_id':buddy,
							'created_at':moment.utc(obj.createdAt).toDate() || MOMENT_NOW_UTC.toDate()
						})
						);
					}
				}
				for (var row of Array.from(buddyRows)) {
					if (!_.find(_.keys(buddies), buddy => buddy === row.buddy_id)) {
						allPromises.push(knex("user_buddies").where({
							'user_id':userId,
							'buddy_id':buddy,
						}).delete()
						);
					}
				}

				allPromises.push(knex("users").where('id','userId').update({'buddy_count':_.keys(buddies).length}));

				return Promise.all(allPromises);
			}
		});
	}

	/**
	 * Sync a user's data from SQL to Firebase.
	 * @private
	 * @param	{String}	userId					User ID.
	 * @param	{Boolean}	shouldSyncBuddyList		Should the buddy list be synced? Defaults to FALSE
	 * @return	{Promise}							Promise that will resolve on completion
	 */
	static _syncUserFromSQLToFirebase(userId,shouldSyncBuddyList){

		if (shouldSyncBuddyList == null) { shouldSyncBuddyList = false; }
		Logger.module("UsersModule").time(`_syncUserFromSQLToFirebase() -> ${userId} + buddies:${shouldSyncBuddyList}`.green);

		return DuelystFirebase.connect().getRootRef()
		.bind({})
		.then(function(fbRootRef){
			this.fbRootRef = fbRootRef;
			return knex.first().from('users').where('id',userId);}).then(function(userRow){

			if (!userRow) {
				throw new Error("Could not find user");
			}

			this.userData = userRow;

			return Logger.module("UsersModule").time(`_syncUserFromSQLToFirebase() -> ${userId} `,this.userData);}).then(() => Promise.all([
            knex.select().from("user_cards").where('user_id',userId),
            knex.first().from('user_card_collection').where('user_id',userId),
            knex.select().from('user_rank_history').where('user_id',userId),
            knex.select().from('user_charges').where('user_id',userId),
            knex.first().from('user_gauntlet_run').where('user_id',userId),
            knex.select().from('user_gauntlet_tickets').where('user_id',userId),
            knex.select().from('user_spirit_orbs').where('user_id',userId),
            knex.select().from('user_decks').where('user_id',userId),
            knex.first().from('user_progression').where('user_id',userId),
            knex.select().from('user_faction_progression').where('user_id',userId),
            knex.select().from('user_quests').where('user_id',userId),
            knex.select().from('user_rewards').where('user_id',userId),
            knex.select().from('user_challenges').where('user_id',userId),
            knex.select().from('user_new_player_progression').where('user_id',userId),
            knex.select().from('user_achievements').whereNotNull('completed_at').andWhere('user_id',userId),
            knex.select().from('user_buddies').where('user_id',userId),
            knex.select().from('user_game_counters').where('user_id',userId),
            knex.select().from('user_game_faction_counters').where('user_id',userId),
            knex.select().from('user_ribbons').where('user_id',userId),
            knex.select().from('user_rank_ratings').where('user_id',userId),
            knex.select().from('user_codex_inventory').where('user_id',userId),
            knex.select().from("user_cosmetic_chests").where('user_id',userId),
            knex.select().from("user_cosmetic_chest_keys").where('user_id',userId),
            knex.select().from("user_cosmetic_inventory").where('user_id',userId),
            knex.select().from("user_bosses_defeated").where('user_id',userId),
            knex.select().from("user_rift_runs").where('user_id',userId)
        ])).spread(function(cardRows,cardCollection,rankHistoryRows,chargeRows,gauntletRun,gauntletTicketRows,spiritOrbRows,decks,progression,factionProgressionRows,questRows,rewardRows,challengeRows,newPlayerModules,completedAchievements,buddyRows,gameCounterRows,factionGameCounterRows,userRibbonRows,userRankRatings,userCodexRows,userCosmeticChests,userCosmeticChestKeys,userCosmeticInventory,userBossesDefeated,userRiftRuns){

			let row;
			const allPromises = [];


			const userData = {
				id:			this.userData.id,
				username: 	this.userData.username,
				created_at: moment.utc(this.userData.created_at).valueOf(),
				has_purchased_starter_bundle: this.userData.has_purchased_starter_bundle,
				rift_stored_upgrade_count: this.userData.rift_stored_upgrade_count,
				free_card_of_the_day_claimed_at:moment.utc(this.userData.free_card_of_the_day_claimed_at || 0).valueOf()
			};

			if (shouldSyncBuddyList) {
				userData.buddies = {};
				for (row of Array.from(buddyRows)) {
					userData.buddies[row.buddy_id] = { createdAt:moment.utc(row.created_at).valueOf() };
				}
			}

			// user profile
			allPromises.push(FirebasePromises.update(this.fbRootRef.child('users').child(userId),userData));

			// indexes
			allPromises.push(FirebasePromises.set(this.fbRootRef.child('username-index').child(this.userData.username),userId));

			// Inventory
			if (cardRows.length > 0) {
				const allCardsJson = _.reduce(cardRows, function(memo,row){
					if (memo[row.card_id] == null) { memo[row.card_id] = {}; }
					memo[row.card_id].count = row.count;
					memo[row.card_id].is_unread = row.is_unread;
					memo[row.card_id].is_new = row.is_new;
					return memo;
				}
				, {});
				console.log(allCardsJson);
				allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-inventory').child(userId).child('card-collection'),allCardsJson));
			} else {
				allPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-inventory').child(userId).child('card-collection')));
			}

			allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-inventory').child(userId).child('wallet'),{
				gold_amount: 			this.userData.wallet_gold,
				spirit_amount: 			this.userData.wallet_spirit,
				updated_at: 			moment.utc(this.userData.wallet_updated_at).valueOf() || null,
				card_last_four_digits:	this.userData.card_last_four_digits
			}));

			const fbOrbs = {};
			for (let orb of Array.from(spiritOrbRows)) {
				const orbId = orb.id;
				delete orb.user_id;
				delete orb.id;
				fbOrbs[orbId] = DataAccessHelpers.restifyData(orb);
			}
			allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-inventory').child(userId).child('spirit-orbs'),fbOrbs));

			const fbTickets = {};
			for (let ticket of Array.from(gauntletTicketRows)) {
				const ticketId = ticket.id;
				delete ticket.user_id;
				delete ticket.id;
				fbTickets[ticketId] = DataAccessHelpers.restifyData(ticket);
			}
			allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-inventory').child(userId).child('gauntlet-tickets'),fbTickets));

			// Gauntlet
			if (gauntletRun) {
				allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-gauntlet-run').child(userId).child('current'),DataAccessHelpers.restifyData(gauntletRun)));
			}

			// Progression
			if (progression) {
				allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-progression').child(userId).child('game-counter'),DataAccessHelpers.restifyData(progression)));
			}
			for (let factionProgression of Array.from(factionProgressionRows)) {
				delete factionProgression.user_id;
				allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-faction-progression').child(userId).child(factionProgression.faction_id).child('stats'),DataAccessHelpers.restifyData(factionProgression)));
			}

			// Quests
			allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-quests').child(userId).child('daily').child('current'),{
				updated_at: moment.utc(this.userData.daily_quests_updated_at).valueOf() || null,
				generated_at: moment.utc(this.userData.daily_quests_generated_at).valueOf() || null
			}));

			const fbQuests = {};
			for (let quest of Array.from(questRows)) {
				const slotIndex = quest.quest_slot_index;
				delete quest.user_id;
				delete quest.quest_slot_index;
				fbQuests[slotIndex] = DataAccessHelpers.restifyData(quest);
			}
			allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-quests').child(userId).child('daily').child('current').child('quests'),fbQuests));

			// Rank
			if (this.userData.rank_starting_at != null) {
				allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-ranking').child(userId).child('current'),{
					rank: this.userData.rank,
					stars: this.userData.rank_stars,
					stars_required: this.userData.rank_stars_required,
					updated_at: moment.utc(this.userData.rank_updated_at).valueOf() || null,
					created_at: moment.utc(this.userData.rank_created_at).valueOf(),
					starting_at: moment.utc(this.userData.rank_starting_at).valueOf()
				}));
			}

			if (this.userData.top_rank_starting_at != null) {
				allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-ranking').child(userId).child('top'),{
					rank: this.userData.top_rank,
					updated_at: moment.utc(this.userData.top_rank_updated_at).valueOf() || null,
					starting_at: moment.utc(this.userData.top_rank_starting_at).valueOf()
				}));
			}

			// # Challenges
			// fbChallenges = {}
			// for challenge in challengeRows
			// 	challengeId = challenge.challenge_id
			// 	delete challenge.user_id
			// 	# delete challenge.challenge_id
			// 	fbChallenges[challengeId] = DataAccessHelpers.restifyData(challenge)
			// allPromises.push(FirebasePromises.set(@.fbRootRef.child('user-challenge-progression').child(userId),fbChallenges))

			// # Decks
			// for deck in decks
			// 	delete deck.user_id
			// 	allPromises.push(FirebasePromises.set(@.fbRootRef.child('user-decks').child(userId).child(deck.id),DataAccessHelpers.restifyData(deck)))

			// # New Player Progression
			// for module in newPlayerModules
			// 	delete module.user_id
			// 	allPromises.push(FirebasePromises.set(@.fbRootRef.child('new-player-progression').child(userId).child('modules').child(module.module_name),DataAccessHelpers.restifyData(module)))

			// Achievements
			let lastCompletedAt = null;
			const fbAchievements = {};
			for (row of Array.from(completedAchievements)) {

				if (row.completed_at > lastCompletedAt) {
					lastCompletedAt = row.completed_at;
					allPromises.push(FirebasePromises.set(this.fbRootRef.child("user-achievements").child(userId).child("status").child('last_read_at'),lastCompletedAt));
				}

				delete row.user_id;
				delete row.progress;
				delete row.progress_required;

				fbAchievements[row.achievement_id] = DataAccessHelpers.restifyData(row);
			}

			allPromises.push(FirebasePromises.set(this.fbRootRef.child("user-achievements").child(userId).child("completed"),fbAchievements));

			// Codex inventory
			for (row of Array.from(userCodexRows)) {
				// Place data in fb for storage after the transaction has completed
				const fbCodexInventoryChapterData = {
					chapter_id: row.chapter_id,
					is_unread: false,
					updated_at: moment.utc(row.updated_at).valueOf(),
					created_at: moment.utc(row.created_at).valueOf()
				};
				allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-inventory').child(userId).child('codex').child(row.chapter_id),fbCodexInventoryChapterData));
			}

			// Cosmetic chests
			const fbUserCosmeticChestData = {};
			for (row of Array.from(userCosmeticChests)) {
				// Place data in fb for storage after the transaction has completed
				const fbCosmeticChestData = DataAccessHelpers.restifyData(row);
				fbUserCosmeticChestData[row.chest_id] = fbCosmeticChestData;
			}
			if (userCosmeticChests.length > 0) {
				allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-inventory').child(userId).child('cosmetic-chests'),fbUserCosmeticChestData));
			} else {
				allPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-inventory').child(userId).child('cosmetic-chests'),fbUserCosmeticChestData));
			}


			// Cosmetic chest keys
			const fbUserCosmeticChestKeyData = {};
			for (row of Array.from(userCosmeticChestKeys)) {
				// Place data in fb for storage after the transaction has completed
				const fbCosmeticChestKeyData = DataAccessHelpers.restifyData(row);
				fbUserCosmeticChestKeyData[row.key_id] = fbCosmeticChestKeyData;
			}
			if (userCosmeticChestKeys.length > 0) {
				allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-inventory').child(userId).child('cosmetic-chest-keys'),fbUserCosmeticChestKeyData));
			} else {
				allPromises.push(FirebasePromises.remove(this.fbRootRef.child('user-inventory').child(userId).child('cosmetic-chest-keys'),fbUserCosmeticChestKeyData));
			}

			// Cosmetic inventory
			for (row of Array.from(userCosmeticInventory)) {
				// Place data in fb for storage after the transaction has completed
				const fbCosmeticData = {
					cosmetic_id: row.cosmetic_id,
					created_at: moment.utc(row.created_at).valueOf()
				};
				allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-inventory').child(userId).child('cosmetic-inventory').child(row.cosmetic_id),fbCosmeticData));
			}


			// for row in gameCounterRows
			// 	gameType = row.game_type
			// 	delete row.user_id
			// 	delete row.game_type
			// 	allPromises.push FirebasePromises.update(rootRef.child('user-game-counters').child(userId).child(gameType).child('stats'),DataAccessHelpers.restifyData(row))

			// for row in factionGameCounterRows
			// 	factionId = row.faction_id
			// 	gameType = row.game_type
			// 	delete row.user_id
			// 	delete row.faction_id
			// 	delete row.game_type
			// 	allPromises.push FirebasePromises.update(rootRef.child('user-game-counters').child(userId).child(gameType).child('factions').child(factionId),DataAccessHelpers.restifyData(row))

			// sync ribbons
			const fbRibbonData = {};
			for (let ribbon of Array.from(userRibbonRows)) {
				if (fbRibbonData[ribbon.ribbon_id] == null) { fbRibbonData[ribbon.ribbon_id] = { ribbon_id:ribbon.ribbon_id, count:0, updated_at:moment.utc(ribbon.created_at).valueOf() }; }
				fbRibbonData[ribbon.ribbon_id].count += 1;
			}
			allPromises.push(FirebasePromises.set(this.fbRootRef.child("user-ribbons").child(userId),fbRibbonData));

			// sync ladder positions
			if (userRankRatings) {
				for (let seasonRankRating of Array.from(userRankRatings)) {
					const fbSeasonStartAt = moment.utc(seasonRankRating.season_starting_at).valueOf();
					const fbUserRatingData = {
						ladder_position: seasonRankRating.ladder_position,
						updated_at: moment.utc(seasonRankRating.updated_at).valueOf()
					};
					allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-ladder-position').child(fbSeasonStartAt).child(userId),fbUserRatingData));
				}
			}

			allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-inventory').child(userId).child('spirit-orb-total').child(SDK.CardSet.Bloodborn),this.userData.total_orb_count_set_3));
			allPromises.push(FirebasePromises.set(this.fbRootRef.child('user-inventory').child(userId).child('spirit-orb-total').child(SDK.CardSet.Unity),this.userData.total_orb_count_set_4));

			// Codex inventory
			for (row of Array.from(userBossesDefeated)) {
				// Place data in fb for storage after the transaction has completed
				const fbDefeatedBossData = {
					boss_id: row.boss_id,
					boss_event_id: row.boss_event_id,
					defeated_at: moment.utc(row.defeated_at).valueOf()
				};
				allPromises.push(FirebasePromises.set(this.fbRootRef.child("user-bosses-defeated").child(userId).child(row.boss_id),fbDefeatedBossData));
			}

			const userRiftRunsFBData = {};
			for (let userRiftRun of Array.from(userRiftRuns)) {
				const fbRiftRunData = DataAccessHelpers.restifyData(userRiftRun);
				// TODO: any data need to be trimmed here?
				userRiftRunsFBData[fbRiftRunData.ticket_id] = fbRiftRunData;
			}
			if ((userRiftRuns != null) && (userRiftRuns.length !== 0)) {
				allPromises.push(FirebasePromises.set(this.fbRootRef.child("user-rift-runs").child(userId),userRiftRunsFBData));
			} else {
				allPromises.push(FirebasePromises.remove(this.fbRootRef.child("user-rift-runs").child(userId)));
			}

			return Promise.all(allPromises);}).then(function(){

			Logger.module("UsersModule").timeEnd(`_syncUserFromSQLToFirebase() -> ${userId} + buddies:${shouldSyncBuddyList}`.green);
			return Promise.all([
				knex("users").where('id',userId).update({ synced_firebase_at:moment().utc().toDate() }),
				FirebasePromises.set(this.fbRootRef.child('users').child(userId).child('tx_counter').child('count'),this.userData.tx_count)
			]);
		});
	}

	static _syncUserFromFirebaseToSQL(srcRootRef,userId,forceResync) {
		if (forceResync == null) { forceResync = false; }
		Logger.module("UsersModule").time(`_syncUserFromFirebaseToSQL() -> ${userId} done`.green);

		const this_obj = {};

		return knex.first('id').from('users').where('id',userId)
		.bind(this_obj)
		.then(function(userRow){

			if (userRow) {
				if (!forceResync) {
					throw new Errors.AlreadyExistsError("This user has already been synced");
				}
				else {}
			}
					// TODO: delete old user data

			const fbRootRef = srcRootRef;

			Logger.module("UsersModule").time("_syncUserFromFirebaseToSQL() -> firebase data loaded");

			return Promise.all([
				FirebasePromises.once(fbRootRef.child("users").child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-inventory').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-quests').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-ranking').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-decks').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-games').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-progression').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-faction-progression').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-challenge-progression').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-arena-run').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-news').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-matchmaking-errors').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-stats').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-rewards').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-receipts').child(userId),"value"),
				FirebasePromises.once(fbRootRef.child('user-new-player-progression').child(userId).child("modules"),"value"),
				FirebasePromises.once(fbRootRef.child('user-achievements').child(userId),"value"),
				// FirebasePromises.once(fbRootRef.child('user-logs').child(userId),"value"),
				// FirebasePromises.once(fbRootRef.child('user-aggregates').child(userId),"value"),
			]);}).spread(function(user,inventory,quests,ranking,decks,games,progression,factionProgression,challengeProgression,arenaRun,news,matchmakingErrors,stats,rewards,receipts,newPlayerProgression,achievements,logs,aggregates) {

			let i;
			this.user = user.val();
			this.buddies = __guard__(user.val(), x => x.buddies);
			this.inventory = inventory != null ? inventory.val() : undefined;
			this.quests = quests != null ? quests.val() : undefined;
			this.ranking = ranking != null ? ranking.val() : undefined;
			this.decks = decks != null ? decks.val() : undefined;
			this.games = games != null ? games.val() : undefined;
			this.progression = progression != null ? progression.val() : undefined;
			this.factionProgression = factionProgression != null ? factionProgression.val() : undefined;
			this.challengeProgression = challengeProgression != null ? challengeProgression.val() : undefined;
			this.arenaRun = arenaRun != null ? arenaRun.val() : undefined;
			this.news = news != null ? news.val() : undefined;
			this.matchmakingErrors = matchmakingErrors != null ? matchmakingErrors.val() : undefined;
			this.stats = stats != null ? stats.val() : undefined;
			this.rewards = rewards != null ? rewards.val() : undefined;
			this.receipts = receipts != null ? receipts.val() : undefined;
			// @.logs = logs?.val()
			// @.aggregates = aggregates?.val()
			this.newPlayerProgression = newPlayerProgression != null ? newPlayerProgression.val() : undefined;
			this.achievements = achievements != null ? achievements.val() : undefined;

			this.currencyLogGold = 0;
			this.currencyLogSpirit = 0;

			// map the faction progression to an object
			if (this.factionProgression instanceof Array) {
				let j;
				const map = {};
				for (j = 0, i = j; j < this.factionProgression.length; j++, i = j) {
					const item = this.factionProgression[i];
					map[i] = item;
				}
				this.factionProgression = m;
			}

			Logger.module("UsersModule").timeEnd("_syncUserFromFirebaseToSQL() -> firebase data loaded");

			// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> inventory", @.inventory
			// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> arenaRun", @.arenaRun

			const toPgDate = function(timestamp){
				if (timestamp) {
					return moment.utc(timestamp).toDate();
				} else {
					return null;
				}
			};

			return knex.transaction(trx=> {

				let key, run;
				const userData = {
					id:userId,
					username:this.user.username.toLowerCase(),
					invite_code:this.authUser.inviteCode,
					created_at: toPgDate(this.user.createdAt),
					updated_at: toPgDate(this.user.updatedAt),
					last_session_at: toPgDate(this.user.presence != null ? this.user.presence.began : undefined),
					ltv:this.user.ltv || 0,
					portrait_id: (this.user.presence != null ? this.user.presence.portrait_id : undefined),
					card_back_id: (this.user.presence != null ? this.user.presence.card_back_id : undefined)
				};

				if (this.buddies) {
					userData.buddy_count = _.keys(this.buddies).length;
				}

				if (this.ranking != null ? this.ranking.current : undefined) {
					userData.rank = this.ranking.current.rank;
					userData.rank_created_at = toPgDate(this.ranking.current.created_at);
					userData.rank_starting_at = toPgDate(this.ranking.current.starting_at);
					userData.rank_stars = this.ranking.current.stars;
					userData.rank_stars_required = this.ranking.current.stars_required;
					userData.rank_updated_at = toPgDate(this.ranking.current.updated_at);
					userData.rank_win_streak = this.ranking.current.win_streak;
					userData.rank_top_rank = this.ranking.current.top_rank;
					userData.rank_is_unread = this.ranking.current.is_unread || false;
					userData.top_rank = this.ranking.top != null ? this.ranking.top.rank : undefined;
					userData.top_rank_starting_at = toPgDate(this.ranking.top != null ? this.ranking.top.starting_at : undefined);
					userData.top_rank_updated_at = toPgDate(this.ranking.top != null ? this.ranking.top.updated_at : undefined);
				}

				if (this.inventory != null ? this.inventory.wallet : undefined) {

					const total_pack_count = _.keys(this.inventory != null ? this.inventory["booster-packs"] : undefined).length + _.keys(this.inventory != null ? this.inventory["used-booster-packs"] : undefined).length;
					const total_ticket_count = _.keys(this.inventory != null ? this.inventory["arena-tickets"] : undefined).length + _.keys(this.inventory != null ? this.inventory["arena-tickets-used"] : undefined).length;
					const total_gold_spent = (total_pack_count*100) + (total_ticket_count*150);

					userData.wallet_gold = (this.inventory != null ? this.inventory.wallet.gold_amount : undefined) || 0;
					userData.wallet_spirit = (this.inventory != null ? this.inventory.wallet.spirit_amount : undefined) || 0;
					userData.wallet_updated_at = toPgDate(this.inventory != null ? this.inventory.wallet.updated_at : undefined) || null;
					userData.total_gold_earned = userData.wallet_gold + total_gold_spent;
				}

				if (__guard__(this.quests != null ? this.quests.daily : undefined, x1 => x1.current)) {
					userData.daily_quests_generated_at = toPgDate(__guard__(__guard__(this.quests != null ? this.quests.daily : undefined, x3 => x3.current), x2 => x2.generated_at));
					userData.daily_quests_updated_at = toPgDate(__guard__(__guard__(this.quests != null ? this.quests.daily : undefined, x5 => x5.current), x4 => x4.updated_at));
				}

				userData.top_gauntlet_win_count = null;

				// top arena win count
				if ((this.arenaRun != null ? this.arenaRun.history : undefined) != null) {
					// console.log("history")
					for (key in (this.arenaRun != null ? this.arenaRun.history : undefined)) {
						// console.log("run #{run.win_count}")
						run = (this.arenaRun != null ? this.arenaRun.history : undefined)[key];
						if (run.win_count > userData.top_gauntlet_win_count) {
							// console.log("run set")
							userData.top_gauntlet_win_count = run.win_count;
						}
					}
				}

				// top arena win count
				// console.log("current run #{@.arenaRun?.current?.win_count}")
				if (__guard__(this.arenaRun != null ? this.arenaRun.current : undefined, x6 => x6.win_count) > userData.top_gauntlet_win_count) {
					// console.log("run set")
					userData.top_gauntlet_win_count = __guard__(this.arenaRun != null ? this.arenaRun.current : undefined, x7 => x7.win_count);
				}

				// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving user data."

				this.userData = userData;

				return trx.insert(userData).into("users")

				.bind(this_obj)
				.then(function() { //buddies

					const inserts = [];

					if (this.buddies) {

						// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving buddy list."

						for (key in this.buddies) {

							const obj = this.buddies[key];
							inserts.push(trx.insert({
								user_id:userId,
								buddy_id:key,
								created_at:toPgDate(obj.createdAt || moment().utc().valueOf())
							}).into("user_buddies")
							);
						}
					}

					return Promise.all(inserts);}).then(function(){ //rank

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving rank data."

					const inserts = [];

					// Mark seasons older than this as read, newer are marked as unread
					const beginUnreadSeasonsTimestamp = moment("9-1-2015 +0000", "MM-DD-YYYY Z").utc().valueOf();

					if ((this.ranking != null ? this.ranking.history : undefined) != null) {
						for (key in (this.ranking != null ? this.ranking.history : undefined)) {

							var rewardIds, rewardsClaimedAt;
							const historyRank = (this.ranking != null ? this.ranking.history : undefined)[key];
							const isUnread = historyRank.starting_at >= beginUnreadSeasonsTimestamp;

							if (isUnread) {
								rewardsClaimedAt = null;
								rewardIds = null;
							} else {
								rewardsClaimedAt = toPgDate(moment.utc().valueOf());
								rewardIds = [];
							}


							// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving history rank ${moment.utc(historyRank.starting_at).format()}."

							inserts.push(trx.insert({
								user_id:userId,
								created_at:toPgDate(historyRank.created_at),
								updated_at:toPgDate(historyRank.updated_at),
								starting_at:toPgDate(historyRank.starting_at),
								rank:historyRank.rank,
								stars:historyRank.stars,
								stars_required:historyRank.stars_required,
								win_streak:historyRank.win_streak,
								top_rank: (historyRank.top_rank != null) ? historyRank.top_rank : historyRank.rank,
								reward_ids:rewardIds,
								rewards_claimed_at:rewardsClaimedAt,
								is_unread:isUnread
							}).into("user_rank_history")
							);
						}
					}

					return Promise.all(inserts);}).then(function(){ //quests

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving quest data."

					let quest;
					const inserts = [];

					if (__guard__(__guard__(this.quests != null ? this.quests.daily : undefined, x9 => x9.current), x8 => x8.quests) != null) {
						for (key in __guard__(__guard__(this.quests != null ? this.quests.daily : undefined, x11 => x11.current), x10 => x10.quests)) {

							// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving CURRENT quest at slot #{key}."

							quest = __guard__(__guard__(this.quests != null ? this.quests.daily : undefined, x11 => x11.current), x10 => x10.quests)[key];
							inserts.push(trx.insert({
								user_id:				userId,
								quest_slot_index:		key,
								quest_type_id:			quest.q_id,
								begin_at:				toPgDate(quest.begin_at),
								created_at:				toPgDate(quest.created_at),
								updated_at:				toPgDate(quest.updated_at),
								mulliganed_at:			toPgDate(quest.mulliganed_at),
								progressed_by_game_ids:	quest.progressedBy,
								// completion_count:	quest.completion_count
								gold:					quest.gold,
								progress:				quest.progress,
								params:					quest.params,
								is_unread:				quest.is_unread,
								read_at:				quest.is_unread ? moment().utc().toDate() : null
							}).into("user_quests")
							);
						}
					}

					if (__guard__(this.quests != null ? this.quests.daily : undefined, x12 => x12.completed) != null) {
						for (key in __guard__(this.quests != null ? this.quests.daily : undefined, x13 => x13.completed)) {

							// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving completed quest #{key}."

							quest = __guard__(this.quests != null ? this.quests.daily : undefined, x13 => x13.completed)[key];
							inserts.push(trx.insert({
								id:						key,
								user_id:				userId,
								quest_type_id:			quest.q_id,
								begin_at:				toPgDate(quest.begin_at),
								created_at:				toPgDate(quest.created_at),
								updated_at:				toPgDate(quest.updated_at),
								completed_at:			toPgDate(quest.completed_at),
								mulliganed_at:			toPgDate(quest.mulliganed_at),
								progressed_by_game_ids:	quest.progressedBy,
								// completion_count:	quest.completion_count
								gold:					quest.gold,
								progress:				quest.progress,
								params:					quest.params,
								is_unread:				quest.is_unread,
								read_at:				quest.is_unread ? moment().utc().toDate() : null
							}).into("user_quests_complete")
							);

							inserts.push(trx.insert({
								id:							generatePushId(),
								user_id:					userId,
								reward_category:			"quest",
								source_id:					key,
								quest_type_id:				quest.q_id,
								gold:						quest.gold,
								created_at:					toPgDate(quest.completed_at),
								is_unread:					false,
								read_at:					toPgDate(quest.completed_at)
							}).into("user_rewards")
							);

							inserts.push(trx.insert({
								id:					generatePushId(),
								user_id:			userId,
								gold:				quest.gold,
								memo:				'quest',
								created_at:			toPgDate(quest.completed_at)
							}).into("user_currency_log")
							);

							this.currencyLogGold += quest.gold;
						}
					}

					return Promise.all(inserts);}).then(function(){ //arena runs

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving gauntlet data."

					let reward, rewardId, rewardIds;
					const inserts = [];

					if (this.arenaRun != null ? this.arenaRun.current : undefined) {

						run = this.arenaRun != null ? this.arenaRun.current : undefined;

						rewardIds = null;
						if (run["rewards"]) {
							rewardIds = [];
							for (reward of Array.from(run["rewards"])) {
								rewardId = generatePushId();
								inserts.push(trx.insert({
									id:							rewardId,
									user_id:					userId,
									reward_category:			"gauntlet run",
									source_id:					run.ticket_id,
									gold:						reward.gold,
									spirit:						reward.spirit,
									spirit_orbs:				reward.booster_packs,
									cards:						reward.cards,
									gauntlet_tickets:			reward.arena_tickets,
									created_at:					toPgDate(run.ended_at),
									is_unread:					false,
									read_at:					toPgDate(run.ended_at)
								}).into("user_rewards")
								);
								rewardIds.push(rewardId);
							}
						}

						inserts.push(trx.insert({
							user_id:			userId,
							ticket_id:			run.ticket_id,
							win_count:			run.win_count || 0,
							loss_count:			run.loss_count || 0,
							draw_count:			run.draw_count || 0,
							is_complete:		run.is_complete || false,
							created_at:			toPgDate(run.created_at),
							updated_at:			toPgDate(run.updated_at),
							started_at:			toPgDate(run.started_at),
							completed_at:		toPgDate(run.completed_at),
							ended_at:			toPgDate(run.ended_at),
							rewards_claimed_at:	toPgDate(run.rewards_claimed_at),
							faction_choices:	run.faction_choices,
							faction_id:			run.faction_id,
							deck:				run.deck,
							card_choices:		run.card_choices,
							reward_ids:			rewardIds
						}).into("user_gauntlet_run")
						);
					}

					for (key in (this.arenaRun != null ? this.arenaRun.history : undefined)) {

						run = (this.arenaRun != null ? this.arenaRun.history : undefined)[key];
						rewardIds = [];

						for (reward of Array.from(run["rewards"])) {
							let cards = null;
							if (reward.card_id) {
								cards = [reward.card_id];
							}

							rewardId = generatePushId();
							inserts.push(trx.insert({
								id:							rewardId,
								user_id:					userId,
								reward_category:			"gauntlet run",
								source_id:					run.ticket_id,
								gold:						reward.gold,
								spirit:						reward.spirit,
								spirit_orbs:				reward.booster_packs,
								cards,
								gauntlet_tickets:			reward.arena_tickets,
								created_at:					toPgDate(run.rewards_claimed_at),
								is_unread:					false,
								read_at:					toPgDate(run.rewards_claimed_at)
							}).into("user_rewards")
							);
							rewardIds.push(rewardId);

							if (reward.gold || reward.spirit) {
								inserts.push(trx.insert({
									id:					generatePushId(),
									user_id:			userId,
									gold:				reward.gold || 0,
									spirit:				reward.spirit || 0,
									memo:				'gauntlet',
									created_at:			toPgDate(run.rewards_claimed_at)
								}).into("user_currency_log")
								);

								this.currencyLogGold += reward.gold || 0;
								this.currencyLogSpirit += reward.spirit || 0;
							}
						}

						inserts.push(trx.insert({
							id:					run.ticket_id,
							user_id:			userId,
							win_count:			run.win_count || 0,
							loss_count:			run.loss_count || 0,
							draw_count:			run.draw_count || 0,
							is_complete:		run.is_complete || false,
							created_at:			toPgDate(run.created_at),
							updated_at:			toPgDate(run.updated_at),
							started_at:			toPgDate(run.started_at),
							completed_at:		toPgDate(run.completed_at),
							ended_at:			toPgDate(run.ended_at),
							rewards_claimed_at:	toPgDate(run.rewards_claimed_at),
							faction_choices:	run.faction_choices,
							faction_id:			run.faction_id,
							deck:				run.deck,
							card_choices:		run.card_choices,
							reward_ids:			rewardIds
						}).into("user_gauntlet_run_complete")
						);
					}

					return Promise.all(inserts);}).then(function(){ //inventory packs/tickets

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving inventory data."

					let pack, ticket;
					const inserts = [];

					const boosterPackGoldDelta = -100;
					const gauntletTicketGoldDelta = -150;

					for (key in (this.inventory != null ? this.inventory["booster-packs"] : undefined)) {
						pack = (this.inventory != null ? this.inventory["booster-packs"] : undefined)[key];
						inserts.push(trx.insert({
							id:					key,
							user_id:			userId,
							transaction_type:	pack.transaction_type,
							transaction_id:		pack.charge_id || pack.ticket_id,
							created_at:			toPgDate(pack.created_at),
							is_unread:			false
						}).into("user_spirit_orbs")
						);

						if (pack.transaction_type === 'soft') {
							inserts.push(trx.insert({
								id:					generatePushId(),
								user_id:			userId,
								gold:				boosterPackGoldDelta,
								memo:				`spirit orb ${key}`,
								created_at:			toPgDate(pack.created_at)
							}).into("user_currency_log")
							);

							this.currencyLogGold += boosterPackGoldDelta;
						}
					}

					for (key in (this.inventory != null ? this.inventory["used-booster-packs"] : undefined)) {
						pack = (this.inventory != null ? this.inventory["used-booster-packs"] : undefined)[key];
						inserts.push(trx.insert({
							id:					key,
							user_id:			userId,
							transaction_type:	pack.transaction_type,
							transaction_id:		pack.charge_id || pack.ticket_id,
							created_at:			toPgDate(pack.created_at),
							opened_at:			toPgDate(pack.opened_at),
							cards:				pack.cards
						}).into("user_spirit_orbs_opened")
						);

						if (pack.transaction_type === 'soft') {
							inserts.push(trx.insert({
								id:					generatePushId(),
								user_id:			userId,
								gold:				boosterPackGoldDelta,
								memo:				`spirit orb ${key}`,
								created_at:			toPgDate(pack.created_at)
							}).into("user_currency_log")
							);

							this.currencyLogGold += boosterPackGoldDelta;
						}
					}

					for (key in (this.inventory != null ? this.inventory["arena-tickets"] : undefined)) {
						ticket = (this.inventory != null ? this.inventory["arena-tickets"] : undefined)[key];
						inserts.push(trx.insert({
							id:					key,
							user_id:			userId,
							transaction_type:	ticket.transaction_type,
							transaction_id:		ticket.transaction_id,
							created_at:			toPgDate(ticket.created_at),
							is_unread:			ticket.is_unread || false
						}).into("user_gauntlet_tickets")
						);

						if (ticket.transaction_type === 'soft') {
							inserts.push(trx.insert({
								id:					generatePushId(),
								user_id:			userId,
								gold:				gauntletTicketGoldDelta,
								memo:				`gauntlet ticket ${key}`,
								created_at:			toPgDate(ticket.created_at)
							}).into("user_currency_log")
							);

							this.currencyLogGold += gauntletTicketGoldDelta;
						}
					}

					for (key in (this.inventory != null ? this.inventory["used-arena-tickets"] : undefined)) {
						ticket = (this.inventory != null ? this.inventory["used-arena-tickets"] : undefined)[key];
						inserts.push(trx.insert({
							id:					key,
							user_id:			userId,
							transaction_type:	ticket.transaction_type,
							transaction_id:		ticket.transaction_id,
							created_at:			toPgDate(ticket.created_at),
							used_at:			toPgDate(ticket.used_at)
						}).into("user_gauntlet_tickets_used")
						);

						if (ticket.transaction_type === 'soft') {
							inserts.push(trx.insert({
								id:					generatePushId(),
								user_id:			userId,
								gold:				gauntletTicketGoldDelta,
								memo:				`gauntlet ticket ${key}`,
								created_at:			toPgDate(ticket.created_at)
							}).into("user_currency_log")
							);

							this.currencyLogGold += gauntletTicketGoldDelta;
						}
					}

					return Promise.all(inserts);}).then(function(){ //receipts

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving receipt data."

					const inserts = [];

					for (key in this.receipts) {

						const charge = this.receipts[key];
						let amount = 0;
						let currency = 'usd';

						if (charge.payment_gross || charge.mc_gross) {
							const gross = charge.payment_gross || charge.mc_gross;
							amount = Math.round(parseFloat(gross)*100);
							currency = charge.mc_currency != null ? charge.mc_currency.toLowerCase() : undefined;
						} else {
							({
                                amount
                            } = charge);
							({
                                currency
                            } = charge);
						}

						let chargeCreated = charge.created;
						if ((charge.created == null) && (charge.payment_date != null)) {
							chargeCreated = Date.parse(charge.payment_date) / 1000;
						}

						inserts.push(trx.insert({
							charge_id:			key,
							user_id:			userId,
							amount,
							currency,
							charge_json:		charge,
							created_at:			toPgDate(chargeCreated*1000)
						}).into("user_charges")
						);
					}

					return Promise.all(inserts);}).then(function(){ //decks

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving decks data."

					const inserts = [];

					for (key in this.decks) {

						const deck = this.decks[key];
						if ((deck.factionId == null)) {
							Logger.module("UsersModule").log(`_syncUserFromFirebaseToSQL() -> ${userId} skipping deck ${key} due to no faction id.`.red);
							continue;
						}

						inserts.push(trx.insert({
							id:					key,
							user_id:			userId,
							name:				deck.name,
							faction_id:			deck.factionId,
							spell_count:		deck.spell_count,
							minion_count:		deck.minion_count,
							artifact_count:		deck.artifact_count,
							color_code:		deck.color_code,
							card_back_id:		deck.card_back_id,
							cards:				deck.cards,
							created_at:			toPgDate(deck.created_at),
							updated_at:			toPgDate(deck.last_edited_at)
						}).into("user_decks")
						);
					}

					return Promise.all(inserts);}).then(function(){ //games

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving games data.".cyan

					let counter;
					const inserts = [];

					const gameCounters = {};
					const factionGameCounters = {};
					const seasonGameCounters = {};

					for (key in this.games) {

						const game = this.games[key];
						if (game.gameType === 'arena') {
							game.gameType = SDK.GameType.Gauntlet;
						}

						inserts.push(trx.insert({
							user_id:				userId,
							game_id:				key,
							game_type:				game.gameType,
							game_server:			game.gameServer,
							is_player_1:			game.isPlayer1,
							is_scored:				!game.isUnscored,
							is_winner:				game.isWinner || false,
							is_draw:				(game.isWinner == null) ? true : false,
							faction_id:				game.factionId,
							general_id:				game.generalId,
							opponent_id:			game.opponentId,
							opponent_faction_id:	game.opponentFactionId,
							opponent_general_id:	game.opponentGeneralId,
							opponent_username:		game.opponentName,
							// deck_cards:			game.
							deck_id:				game.deckId,
							game_version:			game.gameVersion,
							// rewards:				game.
							status:					game.status,
							created_at:				toPgDate(game.createdAt),
							ended_at:				toPgDate(game.updatedAt),
							updated_at:				toPgDate(game.updatedAt)
						}).into("user_games")
						);

						if ((game.gameType != null) && (game.factionId != null)) {
							//
							counter = DataAccessHelpers.updateCounterWithGameOutcome(gameCounters[game.gameType],game.isWinner,game.isWinner === null,game.isUnscored);
							counter.user_id = userId;
							counter.game_type = game.gameType;
							counter.updated_at = toPgDate(game.createdAt);
							gameCounters[game.gameType] = counter;

							//
							if (factionGameCounters[game.gameType] == null) { factionGameCounters[game.gameType] = {}; }
							const factionCounter = DataAccessHelpers.updateCounterWithGameOutcome(factionGameCounters[game.gameType][game.factionId],game.isWinner,game.isWinner === null,game.isUnscored);
							factionCounter.user_id = userId;
							factionCounter.faction_id = game.factionId;
							factionCounter.game_type = game.gameType;
							factionCounter.updated_at = toPgDate(game.createdAt);
							factionGameCounters[game.gameType][game.factionId] = factionCounter;

							//
							if (seasonGameCounters[game.gameType] == null) { seasonGameCounters[game.gameType] = {}; }
							const seasonStartingAt = moment.utc(game.createdAt).startOf('month');
							const seasonCounter = DataAccessHelpers.updateCounterWithGameOutcome(seasonGameCounters[game.gameType][seasonStartingAt.valueOf()],game.isWinner,game.isWinner === null,game.isUnscored);
							seasonCounter.user_id = userId;
							seasonCounter.season_starting_at = seasonStartingAt.toDate();
							seasonCounter.game_type = game.gameType;
							seasonCounter.updated_at = toPgDate(game.createdAt);
							seasonGameCounters[game.gameType][seasonStartingAt.valueOf()] = seasonCounter;
						}
					}

					for (key in gameCounters) {
						counter = gameCounters[key];
						inserts.push(trx.insert(counter).into("user_game_counters"));
					}

					for (key in factionGameCounters) {
						const factions = factionGameCounters[key];
						for (key in factions) {
							counter = factions[key];
							inserts.push(trx.insert(counter).into("user_game_faction_counters"));
						}
					}

					for (key in seasonGameCounters) {
						const seasons = seasonGameCounters[key];
						for (key in seasons) {
							counter = seasons[key];
							inserts.push(trx.insert(counter).into("user_game_season_counters"));
						}
					}

					return Promise.all(inserts);}).then(function(){ //faction progression

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving faction progression data.".cyan

					const inserts = [];

					if (!this.factionProgression) {
						return;
					}

					for (let factionId in this.factionProgression) {

						// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> saving faction #{factionId} data."

						progression = this.factionProgression[factionId];
						if (progression != null ? progression.stats : undefined) {
							({
                                stats
                            } = progression);
							inserts.push(trx.insert({
								user_id:				userId,
								faction_id:				factionId,
								xp:						stats.xp || 0,
								xp_earned:				stats.xp_earned,
								level:					stats.level || 0,
								game_count:				stats.game_count || 0,
								win_count:				stats.win_count || 0,
								draw_count:				stats.draw_count || 0,
								loss_count:				stats.loss_count || (stats.game_count - stats.win_count) || 0,
								unscored_count:			stats.unscored_count || 0,
								created_at:				toPgDate(stats.updated_at),
								updated_at:				toPgDate(stats.updated_at),
								last_game_id:			stats.game_id
							}).into("user_faction_progression")
							);
						}

						let xpSoFar = 0;

						for (key in (progression != null ? progression.progress : undefined)) {
							const progress = (progression != null ? progression.progress : undefined)[key];
							inserts.push(trx.insert({
								user_id:				userId,
								faction_id:				factionId,
								game_id:				key,
								xp_earned:				progress.xp_earned,
								is_winner:				progress.is_winner || false,
								is_draw:				(progress.is_winner == null) ? true : false,
								is_scored:				!progress.is_unscored,
								created_at:				toPgDate(progress.created_at)
							}).into("user_faction_progression_events")
							);

							inserts.push(trx('user_games').where({'user_id':userId,'game_id':key}).update({
								faction_xp:xpSoFar,
								faction_xp_earned:progress.xp_earned
							})
							);

							xpSoFar += progress.xp_earned;
						}

						// faction progression rewards
						for (key in (progression != null ? progression["rewards"] : undefined)) {

							const reward = (progression != null ? progression["rewards"] : undefined)[key];
							let cards = null;
							if (reward.cards) {
								cards = _.reduce(reward.cards,function(memo,card){
									let asc, end;
									for (i = 1, end = card.count, asc = 1 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
										memo.push(card.id);
									}
									return memo;
								}
								,[]);
							}

							// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> saving reward..."
							const factionName = SDK.FactionFactory.factionForIdentifier(factionId).devName;

							inserts.push(trx.insert({
								id:							generatePushId(),
								game_id:					key,
								user_id:					userId,
								reward_category:			"faction xp",
								reward_type:				`${factionName} L${reward.level}`,
								gold:						reward.gold,
								spirit:						reward.spirit,
								spirit_orbs:				reward.booster_packs,
								created_at:					toPgDate(reward.created_at),
								cards,
								cosmetics:					reward.emotes,
								is_unread:					false,
								read_at:					moment().utc().toDate()
							}).into("user_rewards")
							);
						}
					}

					return Promise.all(inserts);}).then(function(){ //cards collection

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving card collection data.".cyan

					let card, cardId, cards, reward;
					const inserts = [];

					const cardLog = [];
					const cardCounts = {};

					// faction xp cards
					if (this.factionProgression) {
						// faction XP cards
						for (let factionId in this.factionProgression) {

							progression = this.factionProgression[factionId];
							if (progression != null) {
								const factionName = SDK.FactionFactory.factionForIdentifier(factionId).devName;

								// faction progression rewards
								for (key in (progression != null ? progression["rewards"] : undefined)) {
									reward = (progression != null ? progression["rewards"] : undefined)[key];
									if (reward.cards) {
										cards = _.reduce(reward.cards,function(memo,card){
											let asc, end;
											for (i = 1, end = card.count, asc = 1 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
												memo.push(card.id);
											}
											return memo;
										}
										,[]);

										for (cardId of Array.from(cards)) {

											// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> earned #{cardId} via faction XP."

											cardLog.push({
												id:						generatePushId(),
												user_id:				userId,
												card_id:				cardId,
												is_credit:				true,
												source_type:			"faction xp",
												memo:					`${factionName} L${reward.level}`,
												created_at:				toPgDate(reward.created_at)
											});

											if (cardCounts[cardId] == null) { cardCounts[cardId] = {
												user_id:				userId,
												card_id:				cardId,
												count:					0,
												created_at:				toPgDate(reward.created_at),
												is_unread:				false
											}; }

											cardCounts[cardId].count += 1;
										}
										cardCounts[cardId].updated_at = toPgDate(reward.created_at);
									}
								}
							}
						}
					}

					// gauntlet reward cards
					const allRuns = _.values(this.arenaRun != null ? this.arenaRun.history : undefined) || [];
					if (__guard__(this.arenaRun != null ? this.arenaRun.current : undefined, x8 => x8.rewards)) {
						allRuns.push(this.arenaRun != null ? this.arenaRun.current : undefined);
					}

					for (run of Array.from(allRuns)) {
						for (reward of Array.from(run.rewards)) {
							if (reward.card_id) {
								cardId = reward.card_id;

								// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> earned #{cardId} via gauntlet."

								cardLog.push({
									id:						generatePushId(),
									user_id:				userId,
									card_id:				cardId,
									is_credit:				true,
									source_type:			"gauntlet",
									source_id:				run.ticket_id,
									created_at:				toPgDate(run.rewards_claimed_at)
								});

								if (cardCounts[cardId] == null) { cardCounts[cardId] = {
									user_id:				userId,
									card_id:				cardId,
									count:					0,
									created_at:				toPgDate(run.rewards_claimed_at),
									is_unread:				false
								}; }

								cardCounts[cardId].count += 1;
								cardCounts[cardId].updated_at = toPgDate(run.rewards_claimed_at);
							}
						}
					}

					// achievement reward cards
					if (this.achievements != null ? this.achievements.completed : undefined) {
						for (let achievementId in this.achievements.completed) {
							const achievementData = this.achievements.completed[achievementId];
							if (achievementData.rewards.card_ids) {
								for (cardId of Array.from(achievementData.rewards.card_ids)) {
									// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> earned #{cardId} via achievement."

									cardLog.push({
										id:						generatePushId(),
										user_id:				userId,
										card_id:				cardId,
										is_credit:				true,
										source_type:			"achievement",
										source_id:				achievementId,
										created_at:				toPgDate(achievementData.completed_at)
									});

									if (cardCounts[cardId] == null) { cardCounts[cardId] = {
										user_id:				userId,
										card_id:				cardId,
										count:					0,
										created_at:				toPgDate(achievementData.completed_at),
										is_unread:				false
									}; }

									cardCounts[cardId].count += 1;
									cardCounts[cardId].updated_at = toPgDate(achievementData.completed_at);
								}
							}
						}
					}

					// booster cards
					for (let packId in (this.inventory != null ? this.inventory["used-booster-packs"] : undefined)) {

						// console.log "PACK: #{packId}".red
						// console.log "CARDS: #{packId}",pack.cards

						const pack = (this.inventory != null ? this.inventory["used-booster-packs"] : undefined)[packId];
						({
                            cards
                        } = pack);
						for (cardId of Array.from(cards)) {

							// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> earned #{cardId} via packs."

							cardLog.push({
								id:						generatePushId(),
								user_id:				userId,
								card_id:				cardId,
								is_credit:				true,
								source_type:			"spirit orb",
								source_id:				packId,
								created_at:				toPgDate(pack.opened_at)
							});

							if (cardCounts[cardId] == null) { cardCounts[cardId] = {
								user_id:				userId,
								card_id:				cardId,
								count:					0,
								created_at:				toPgDate(pack.opened_at),
								is_unread:				false
							}; }

							cardCounts[cardId].count += 1;
							cardCounts[cardId].updated_at = toPgDate(pack.opened_at);
						}
					}

					// all other cards
					if (this.inventory != null ? this.inventory["card-collection"] : undefined) {
						if (this.inventory != null) {
							delete this.inventory["card-collection"].tx_id;
						}
					}

					// before going through actual collection, mark all cards earned so far but missing from collection as disenchanted, and update its card count
					for (cardId in cardCounts) {
						card = cardCounts[cardId];
						if (!(this.inventory != null ? this.inventory['card-collection'][cardId] : undefined)) {

							var asc, end;
							Logger.module("UsersModule").log(`_syncUserFromFirebaseToSQL() -> missing card ${cardId} - marking as disenchanted.`);

							for (i = 1, end = card.count, asc = 1 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
								cardLog.push({
									id:						generatePushId(),
									user_id:				userId,
									card_id:				cardId,
									is_credit:				false,
									source_type:			"crafting",
									created_at:				moment().utc().toDate()
								});
							}

							// Update card count to 0
							card.count = 0;
						}
					}

					//... ok process actual collection
					for (cardId in (this.inventory != null ? this.inventory["card-collection"] : undefined)) {

						// if there is an "undefined" in the card count, just feel free to skip
						card = (this.inventory != null ? this.inventory["card-collection"] : undefined)[cardId];
						if ((card.count == null)) {
							continue;
						}

						if (cardCounts[cardId] == null) { cardCounts[cardId] = {
							user_id:				userId,
							card_id:				cardId,
							count:					0,
							created_at:				moment().utc().toDate()
						}; }

						const countSoFar = (cardCounts[cardId] != null ? cardCounts[cardId].count : undefined) || 0;
						const countDelta = card.count - countSoFar;

						// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> card #{cardId}. count = #{countSoFar}. collection count = #{card.count}".blue


						if (countDelta > 0) {

							var asc1, end1;
							for (i = 1, end1 = countDelta, asc1 = 1 <= end1; asc1 ? i <= end1 : i >= end1; asc1 ? i++ : i--) {

								// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> un-accounted for card #{cardId} - marking as crafted."

								cardLog.push({
									id:						generatePushId(),
									user_id:				userId,
									card_id:				cardId,
									is_credit:				true,
									source_type:			"crafting",
									created_at:				moment().utc().toDate()
								});
							}

						} else if (countDelta < 0) {

							var asc2, end2;
							for (i = 1, end2 = Math.abs(countDelta), asc2 = 1 <= end2; asc2 ? i <= end2 : i >= end2; asc2 ? i++ : i--) {

								// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> missing card #{cardId} - marking as disenchanted."

								cardLog.push({
									id:						generatePushId(),
									user_id:				userId,
									card_id:				cardId,
									is_credit:				false,
									source_type:			"crafting",
									created_at:				moment().utc().toDate()
								});
							}
						}

						// set the correct final count
						cardCounts[cardId].count = card.count;
						cardCounts[cardId].is_unread = card.is_unread;
						cardCounts[cardId].is_new = card.is_new;
					}

					for (let log of Array.from(cardLog)) {
						inserts.push(trx.insert(log).into("user_card_log"));
					}

					for (let id in cardCounts) {
						card = cardCounts[id];
						if (card.count) {
							inserts.push(trx.insert(card).into("user_cards"));
						}
					}

					if (this.inventory != null ? this.inventory["card-collection"] : undefined) {
						inserts.push(trx.insert({
							user_id:userId,
							cards:(this.inventory != null ? this.inventory["card-collection"] : undefined),
							created_at:moment().utc().toDate()
						}).into("user_card_collection")
						);
					}

					return Promise.all(inserts);}).then(function(){ //progression

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} progression data.".cyan

					const inserts = [];

					if (this.progression != null ? this.progression["game-counter"] : undefined) {
						stats = this.progression != null ? this.progression["game-counter"] : undefined;
						inserts.push(trx.insert({
							user_id:					userId,
							game_count:					stats.game_count || 0,
							win_count:					stats.win_count || 0,
							win_streak:					stats.win_streak || 0,
							loss_count:					stats.loss_count || 0,
							draw_count:					stats.draw_count || 0,
							unscored_count:				stats.unscored_count || 0,
							updated_at:					toPgDate(stats.updated_at),
							last_game_id:				stats.last_game_id,
							last_awarded_game_count:	stats.last_awarded_game_count,
							last_awarded_win_count:		stats.last_awarded_win_count,
							last_awarded_win_count_at:	toPgDate(stats.last_awarded_win_count_at),
							last_daily_win_at:			toPgDate(stats.last_daily_win_at),
							last_win_at:				toPgDate(stats.last_win_at),
							win_awards_last_maxed_at:	toPgDate(stats.win_awards_last_maxed_at),
							play_awards_last_maxed_at:	toPgDate(stats.play_awards_last_maxed_at)
						}).into("user_progression")
						);
					}

					for (key in (this.progression != null ? this.progression["game-counter-days"] : undefined)) {
						const day = (this.progression != null ? this.progression["game-counter-days"] : undefined)[key];
						inserts.push(trx.insert({
							user_id:					userId,
							date:						key,
							game_count:					day.game_count || 0,
							win_count:					day.win_count || 0,
							win_streak:					day.win_streak || 0,
							loss_count:					day.loss_count || 0,
							draw_count:					day.draw_count || 0,
							unscored_count:			day.unscored_count || 0
						}).into("user_progression_days")
						);
					}

					// daily win / 4-game count / etc.
					for (key in (this.progression != null ? this.progression["game-counter-rewards"] : undefined)) {
						const reward = (this.progression != null ? this.progression["game-counter-rewards"] : undefined)[key];
						inserts.push(trx.insert({
							id:							key,
							user_id:					userId,
							reward_category:			"game counter",
							reward_type:				reward.type,
							gold:						reward.gold_amount,
							spirit:						reward.spirit_amount,
							cores:						reward.cores_amount,
							created_at:					toPgDate(reward.created_at),
							is_unread:					reward.is_unread,
							read_at:					moment().utc().toDate()
						}).into("user_rewards")
						);

						inserts.push(trx.insert({
							id:					generatePushId(),
							user_id:			userId,
							gold:				reward.gold_amount,
							memo:				reward.type,
							created_at:			toPgDate(reward.created_at)
						}).into("user_currency_log")
						);

						this.currencyLogGold += reward.gold_amount;
					}


					return Promise.all(inserts);}).then(function(){ //challenges

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving challenges data.".cyan

					const inserts = [];

					// daily quest rewards
					for (let challengeType in this.challengeProgression) {

						const challenge = this.challengeProgression[challengeType];
						const goldReward = SDK.ChallengeFactory.getGoldRewardedForChallengeType(challengeType);

						const allPromises = [];
						let rewardIds = null;

						if (goldReward && challenge.completed_at) {

							rewardIds = [];

							// set up reward data
							const rewardData = {
								id:generatePushId(),
								user_id:userId,
								reward_category:"challenge",
								reward_type:challengeType,
								gold:goldReward,
								created_at:toPgDate(challenge.completed_at),
								is_unread:false
							};

							rewardIds.push(rewardData.id);

							// add the promise to our list of reward promises
							inserts.push(trx("user_rewards").insert(rewardData));

							inserts.push(trx.insert({
								id:					generatePushId(),
								user_id:			userId,
								gold:				goldReward,
								memo:				'challenge',
								created_at:			toPgDate(challenge.completed_at)
							}).into("user_currency_log")
							);

							this.currencyLogGold += goldReward;
						}

						inserts.push(trx.insert({
							user_id:					userId,
							challenge_id:				challengeType,
							completed_at:				challenge.completed_at ? toPgDate(challenge.completed_at) : null,
							last_attempted_at:			toPgDate(challenge.last_attempted_at),
							is_unread:					false,
							reward_ids:					rewardIds
						}).into("user_challenges")
						);
					}

					return Promise.all(inserts);}).then(function(){ //new player progression

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving new player progression data.".cyan

					const inserts = [];

					// daily quest rewards
					for (let moduleName in this.newPlayerProgression) {

						const data = this.newPlayerProgression[moduleName];
						inserts.push(trx.insert({
							user_id:					userId,
							module_name:				moduleName,
							stage:						data.stage,
							updated_at:					toPgDate(data.updated_at),
							is_unread:					false
						}).into("user_new_player_progression")
						);
					}

					return Promise.all(inserts);}).then(function(){ //emotes

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving emotes.".cyan

					const inserts = [];

					// # daily quest rewards
					// if @.inventory?.emotes
					// 	for emoteId,data of @.inventory?.emotes
					//
					// 		inserts.push trx.insert(
					// 			user_id:					userId
					// 			emote_id:					emoteId
					// 			created_at:					toPgDate(data.created_at)
					// 			transaction_type:			data.transaction_type
					// 			is_unread:					false
					// 		).into("user_emotes")


					return Promise.all(inserts);}).then(function(){ //achievements

					// Logger.module("UsersModule").log "_syncUserFromFirebaseToSQL() -> #{userId} saving achievements.".cyan

					let achievement, data, id;
					const inserts = [];

					// ...
					if (this.achievements != null ? this.achievements.completed : undefined) {
						for (id in this.achievements.completed) {

							data = this.achievements.completed[id];
							achievement = SDK.AchievementsFactory.achievementForIdentifier(id);
							const rewardId = generatePushId();

							inserts.push(trx.insert({
								user_id:					userId,
								achievement_id:				id,
								created_at:					toPgDate(data.completed_at),
								completed_at:				toPgDate(data.completed_at),
								progress:					achievement.progressRequired,
								progress_required:			achievement.progressRequired,
								reward_ids:					[rewardId],
								is_unread:					false
							}).into("user_achievements")
							);

							// set up reward data
							const rewardData = {
								id:						rewardId,
								user_id:				userId,
								reward_category:		"achievement",
								reward_type:			id,
								gold:					data.rewards.gold,
								spirit:					data.rewards.spirit,
								spirit_orbs:			data.rewards.spirit_orb,
								gauntlet_tickets:		data.rewards.gauntlet_ticket,
								cards:					data.rewards.card_ids,
								created_at:				toPgDate(data.completed_at),
								read_at:				toPgDate(data.completed_at),
								is_unread:false
							};

							// add the promise to our list of reward promises
							inserts.push(trx("user_rewards").insert(rewardData));

							if (data.rewards.gold || data.rewards.spirit) {
								inserts.push(trx.insert({
									id:					generatePushId(),
									user_id:			userId,
									gold:				data.rewards.gold || 0,
									spirit:				data.rewards.spirit || 0,
									memo:				'achievement',
									created_at:			toPgDate(data.completed_at)
								}).into("user_currency_log")
								);

								this.currencyLogGold += data.rewards.gold || 0;
								this.currencyLogSpirit += data.rewards.spirit|| 0;
							}
						}
					}

					// ...
					if (this.achievements != null ? this.achievements.progress : undefined) {
						for (id in this.achievements.progress) {

							data = this.achievements.progress[id];
							if (__guard__(this.achievements != null ? this.achievements.completed : undefined, x8 => x8[id])) {
								continue;
							}

							achievement = SDK.AchievementsFactory.achievementForIdentifier(id);

							inserts.push(trx.insert({
								user_id:					userId,
								achievement_id:				id,
								created_at:					toPgDate(data.updated_at),
								updated_at:					toPgDate(data.updated_at),
								progress:					data.progress,
								progress_required:			achievement.progressRequired,
								is_unread:					false
							}).into("user_achievements")
							);
						}
					}


					return Promise.all(inserts);}).then(function(){ //rebuild LTV

					let amount = 0;
					let purchase_count = 0;
					let last_purchase_at = 0;

					for (key in this.receipts) {

						const charge = this.receipts[key];
						purchase_count += 1;

						if (charge.created && (charge.created > last_purchase_at)) {
							last_purchase_at = charge.created;
						}

						if (charge.payment_date) {
							const payment_timestamp = moment(charge.payment_date).utc().valueOf();
							if (payment_timestamp > last_purchase_at) {
								last_purchase_at = payment_timestamp;
							}
						}

						if (charge.payment_gross || charge.mc_gross) {
							const gross = charge.payment_gross || charge.mc_gross;
							amount += Math.round(parseFloat(gross)*100);
						} else {
							amount += charge.amount;
						}
					}

					// set correct LTV based on all transactions
					return trx("users").where('id',userId).update({
						'ltv':				amount,
						'purchase_count':	purchase_count,
						'last_purchase_at':	moment(last_purchase_at).utc().toDate()
					});}).then(function(){ // Handle currency log mismatch
					const userWalletGold = (this.inventory != null ? this.inventory.wallet.gold_amount : undefined) || 0;
					const userWalletSpirit = (this.inventory != null ? this.inventory.wallet.spirit_amount : undefined) || 0;
					if ((userWalletGold !== this.currencyLogGold) || (userWalletSpirit !== this.currencyLogSpirit)) {
						const goldDelta = userWalletGold - this.currencyLogGold;
						const spiritDelta = userWalletSpirit - this.currencyLogSpirit;
						return trx.insert({
							id:					generatePushId(),
							user_id:			userId,
							gold:				goldDelta || null,
							spirit:				spiritDelta || null,
							memo:				'sql migration mismatch',
							created_at:			toPgDate(moment().utc().valueOf())
						}).into("user_currency_log");
					} else {
						return Promise.resolve();
					}
				});
			});}).then(function(){

			Logger.module("UsersModule").timeEnd(`_syncUserFromFirebaseToSQL() -> ${userId} done`.green);

			this.userData.portrait_id = (this.user.presence != null ? this.user.presence.portrait_id : undefined) || null;
			this.userData.card_back_id = (this.user.presence != null ? this.user.presence.card_back_id : undefined) || null;

			return this.userData;
		});
	}
}


module.exports = SyncModule;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}