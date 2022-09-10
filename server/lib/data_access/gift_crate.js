/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const util = require('util');
const Promise = require('bluebird');
const FirebasePromises = require('../firebase_promises');
const DuelystFirebase = require('../duelyst_firebase_module');
const Logger = require('../../../app/common/logger.coffee');
const colors = require('colors');
const moment = require('moment');
const _ = require('underscore');
const InventoryModule = require('./inventory');
const CosmeticChestsModule = require('./cosmetic_chests');
const SyncModule = require('./sync');
const Errors = require('../custom_errors');
const knex = require('../data_access/knex');
const generatePushId = require('../../../app/common/generate_push_id');

// SDK imports
const SDK = require('../../../app/sdk');
const GiftCrateFactory = require('../../../app/sdk/giftCrates/giftCrateFactory.coffee');
const GiftCrateLookup = require("../../../app/sdk/giftCrates/giftCrateLookup");
const CosmeticsFactory = require('../../../app/sdk/cosmetics/cosmeticsFactory.coffee');
const CosmeticsLookup = require('../../../app/sdk/cosmetics/cosmeticsLookup.coffee');

class GiftCrateModule {

	/**
	 * Add a gift crate pack to a user's inventory
	 * @public
	 * @param	{Promise}		trxPromise					Transaction promise that resolves if transaction succeeds.
	 * @param	{Transaction}	trx							KNEX transaction to attach this operation to.
	 * @param	{String}		userId						User ID for which to buy a booster pack.
	 * @param	{String}		crateType						Type of crate to give the user
	 * @param	{String}		transactionId				the identifier for the transaction that caused this booster to be added.
	 * @return	{Promise}		Promise that will post BOOSTER PACK DATA on completion.
	 */
	static addGiftCrateToUser(trxPromise, trx, userId, crateType, transactionId=null,systemTime=null){//sourceType, sourceId,memo
		const current_utc = systemTime || moment().utc();

		// userId must be defined
		if (!userId) {
			Logger.module("GiftCrateModule").debug(`addGiftCrateToUser() -> invalid user ID - ${userId}.`.red);
			return Promise.reject(new Error(`Can not add gift crate : invalid user ID - ${userId}`));
		}

		// userId must be defined
		if (!trx) {
			Logger.module("GiftCrateModule").debug(`addGiftCrateToUser() -> invalid trx - ${trx}.`.red);
			return Promise.reject(new Error("Can not add gift crate : invalid transaction parameter"));
		}


		const crateId = generatePushId();

		Logger.module("GiftCrateModule").time(`addGiftCrateToUser() -> added ${crateId} to user ${userId.blue}.`.green);

		// return the insert statement and attach it to the transaction
		return trx.insert({
			crate_id:					crateId,
			user_id:					userId,
			crate_type: 			crateType,
			is_unread:				true,
			created_at:			current_utc.toDate()
		})
		.into("user_gift_crates")
		// .then ()-> return DuelystFirebase.connect().getRootRef()
		// .then (fbRootRef) ->
		// 	boosters = fbRootRef.child("user-inventory").child(userId).child("spirit-orbs")
		// 	booster_data =
		// 		created_at:current_utc.valueOf()
		// 		transaction_type:transactionType
		// 	return FirebasePromises.set(boosters.child(crateId),booster_data)
		.then(function(){
			Logger.module("GiftCrateModule").timeEnd(`addGiftCrateToUser() -> added ${crateId} to user ${userId.blue}.`.green);
			return Promise.resolve(crateId);
		});
	}

	/**
	 * Claim rewards for a season's rank.
	 * @public
	 * @param	{String}	userId				User ID.
	 * @param	{String}	crateId				Crate ID.
	 * @param	{String}	keyId				  Optional - key id being used (not implemented
	 * @param	{Moment}	systemTime			Pass in the current system time to override clock. Used mostly for testing.
	 * @return	{Promise}						Promise that will return rewards array on completion.
	 */
	static unlockGiftCrate(userId,crateId,keyId,systemTime) {
		let txPromise;
		const current_utc = systemTime || moment().utc();

		// userId must be defined
		if (!userId) {
			return Promise.reject(new Error(`Can not claim gift crate: invalid user ID - ${userId}`));
		}

		// userId must be defined
		if (!crateId) {
			return Promise.reject(new Error(`Can not claim gift crate: no crate ID for user id - ${userId}`));
		}

		const this_obj = {};
		this_obj.userId = userId;
		this_obj.crateId = crateId;
		this_obj.keyId = keyId;

		return txPromise = knex.transaction(function(tx){

			knex.first().from('user_gift_crates').where({'user_id':userId,'crate_id':crateId}).transacting(tx).forUpdate()
			.bind(this_obj)
			.then(function(giftCrateRow){

				let cosmetic_id, dropSeed, i;
				if ((giftCrateRow == null) || (giftCrateRow.user_id !== userId)) {
					return Promise.reject(new Errors.NotFoundError("The gift crate ID provided does not exist or belong to you."));
				}

				this.giftCrateRow = giftCrateRow;

				const allPromises = [];
				const rewardRows = [];
				this.rewardsToReturn = [];

				const giftTemplateData = GiftCrateFactory.giftCrateTemplateForType(giftCrateRow.crate_type);

				if ((giftTemplateData == null)) {
					return Promise.reject(new Errors.UnexpectedBadDataError(`No gift crate data for type ${giftCrateRow.crate_type}`));
				}

				if (!GiftCrateFactory.getIsCrateTypeAvailable(giftCrateRow.crate_type,current_utc)) {
					return Promise.reject(new Errors.UnexpectedBadDataError("The gift crate ID is not yet available."));
				}

				// spirit
				if (giftTemplateData.rewards.spirit) {
					rewardRows.push({
						id:					generatePushId(),
						user_id: 			userId,
						reward_category: 	'gift crate',
						reward_type: 		giftCrateRow.crate_type,
						source_id: 			crateId,
						created_at: 		current_utc.toDate(),
						spirit:				giftTemplateData.rewards.spirit,
						is_unread:			true
					});

					this.rewardsToReturn.push({
						spirit:				giftTemplateData.rewards.spirit});

					allPromises.push(InventoryModule.giveUserSpirit(txPromise,tx,userId,giftTemplateData.rewards.spirit,"gift crate reward",crateId));
				}

				// gold
				if (giftTemplateData.rewards.gold) {
					rewardRows.push({
						id:					generatePushId(),
						user_id: 			userId,
						reward_category: 	'gift crate',
						reward_type: 		giftCrateRow.crate_type,
						source_id: 			crateId,
						created_at: 		current_utc.toDate(),
						gold:				giftTemplateData.rewards.gold,
						is_unread:			true
					});

					this.rewardsToReturn.push({
						gold:				giftTemplateData.rewards.gold});

					allPromises.push(InventoryModule.giveUserGold(txPromise,tx,userId,giftTemplateData.rewards.gold,"gift crate reward",crateId));
				}

				// static cards and random cards
				const cardsToGive = _.clone(giftTemplateData.rewards.card_ids) || [];
				if (((giftTemplateData.rewards.random_cards != null ? giftTemplateData.rewards.random_cards.length : undefined) > 0) || (cardsToGive.length > 0)) {

					const cardsRewardRow = {
						id:					generatePushId(),
						user_id: 			userId,
						reward_category: 	'gift crate',
						reward_type: 		giftCrateRow.crate_type,
						source_id: 			crateId,
						created_at: 		current_utc.toDate(),
						cards:				cardsToGive,
						is_unread:			true
					};

					rewardRows.push(cardsRewardRow);

					if ((giftTemplateData.rewards.random_cards != null ? giftTemplateData.rewards.random_cards.length : undefined) > 0) {
						for (let randomCardInfo of Array.from(giftTemplateData.rewards.random_cards)) {
							const cardsToSampleFrom = SDK.GameSession.getCardCaches().getCardSet(SDK.CardSet.Core).getRarity(randomCardInfo.rarity).getIsUnlockable(false).getIsCollectible(true).getIsPrismatic(false).getCards();
							const randomCardId = _.sample(cardsToSampleFrom).getId();
							cardsRewardRow.cards.push(randomCardId);
						}
					}

					this.rewardsToReturn.push({
						cards:				cardsRewardRow.cards});

					allPromises.push(InventoryModule.giveUserCards(txPromise,tx,userId,cardsRewardRow.cards,"gift crate reward",crateId));
				}

				if (giftTemplateData.rewards.spirit_orbs) {
					let asc, end;
					const cardSetId = giftTemplateData.rewards.spirit_orbs_set || SDK.CardSet.Core;
					for (i = 1, end = giftTemplateData.rewards.spirit_orbs, asc = 1 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
						rewardRows.push({
							id:					generatePushId(),
							user_id: 			userId,
							reward_category: 	'gift crate',
							reward_type: 		giftCrateRow.crate_type,
							source_id: 			crateId,
							created_at: 		current_utc.toDate(),
							spirit_orbs:		cardSetId,
							is_unread:			true
						});

						this.rewardsToReturn.push({
							spirit_orbs:		cardSetId});

						allPromises.push(InventoryModule.addBoosterPackToUser(txPromise,tx,userId,cardSetId,"gift crate reward",crateId));
					}
				}

				if (giftTemplateData.rewards.gauntlet_tickets) {
					let asc1, end1;
					for (i = 1, end1 = giftTemplateData.rewards.gauntlet_tickets, asc1 = 1 <= end1; asc1 ? i <= end1 : i >= end1; asc1 ? i++ : i--) {
						rewardRows.push({
							id:					generatePushId(),
							user_id: 			userId,
							reward_category: 	'gift crate',
							reward_type: 		giftCrateRow.crate_type,
							source_id: 			crateId,
							created_at: 		current_utc.toDate(),
							gauntlet_tickets:	1,
							is_unread:			true
						});

						this.rewardsToReturn.push({
							gauntlet_tickets:	1});

						allPromises.push(InventoryModule.addArenaTicketToUser(txPromise,tx,userId,"gift crate reward",crateId));
					}
				}

				if ((giftTemplateData.rewards.crate_keys != null ? giftTemplateData.rewards.crate_keys.length : undefined) > 0) {
					for (let keyType of Array.from(giftTemplateData.rewards.crate_keys)) {
						rewardRows.push({
							id:					generatePushId(),
							user_id: 			userId,
							reward_category: 	'gift crate',
							reward_type: 		giftCrateRow.crate_type,
							source_id: 			crateId,
							created_at: 		current_utc.toDate(),
							cosmetic_keys:		[keyType],
							is_unread:			true
						});
						allPromises.push(CosmeticChestsModule.giveUserChestKey(txPromise,tx,userId,keyType,1,"gift crate reward",crateId));
					}

					this.rewardsToReturn.push({
						cosmetic_keys: giftTemplateData.rewards.crate_keys});
				}

				if ((giftTemplateData.rewards.cosmetics != null ? giftTemplateData.rewards.cosmetics.length : undefined) > 0) {

					for (cosmetic_id of Array.from(giftTemplateData.rewards.cosmetics)) {

						rewardRows.push({
							id:					generatePushId(),
							user_id: 			userId,
							reward_category: 	'gift crate',
							reward_type: 		giftCrateRow.crate_type,
							source_id: 			crateId,
							created_at: 		current_utc.toDate(),
							cosmetics:			giftTemplateData.rewards.cosmetics,
							is_unread:			true
						});

						allPromises.push(InventoryModule.giveUserCosmeticId(txPromise, tx, userId, cosmetic_id, "gift crate reward", crateId, null, current_utc));

						this.rewardsToReturn.push({
							cosmetic_id});
					}
				}

				if (giftTemplateData.rewards.spirit_box != null) {
					if ((giftCrateRow.crate_type === GiftCrateLookup.FrostfirePurchasable2017) || (giftCrateRow.crate_type === GiftCrateLookup.FrostfirePremiumPurchasable2017)) {
						dropSeed = Math.random();
						let spiritBoxReward = null;
						if (dropSeed < 0.5) {
							spiritBoxReward = 50;
						} else if (dropSeed < 0.75) {
							spiritBoxReward = 100;
						} else if (dropSeed < 0.925) {
							spiritBoxReward = 225;
						} else {
							spiritBoxReward = 450;
						}

						allPromises.push(InventoryModule.giveUserSpirit(txPromise,tx,userId,spiritBoxReward,"gift crate reward",crateId));
						this.rewardsToReturn.push({
							spirit:	spiritBoxReward});
					} else {
						return Promise.reject(new Errors.NotFoundError("No spirit box template for this gift crate type"));
					}
				}

				if (giftTemplateData.rewards.cosmetic_box != null) {
					if ((giftCrateRow.crate_type === GiftCrateLookup.FrostfirePurchasable2017) || (giftCrateRow.crate_type === GiftCrateLookup.FrostfirePremiumPurchasable2017)) {
//						Faction3GeneralFestive: 1000023
//						Faction6GeneralFestive: 1000024
//						FestiveZyx: 1000025
//						FestiveSnowchaser: 1000019
//						FrostfireTiger: 1000018
//						Snowchaser: 10009
						dropSeed = Math.random();
						let cosmeticBoxReward = null;
						let overrideSpiritRefundAmount = null;
						if (dropSeed < 0.30) {
							cosmeticBoxReward = CosmeticsLookup.CardSkin.FestiveSnowchaser;
							overrideSpiritRefundAmount = 20;
						} else if (dropSeed < 0.60) {
							cosmeticBoxReward = CosmeticsLookup.CardSkin.FrostfireTiger;
							overrideSpiritRefundAmount = 20;
						} else if (dropSeed < 0.75) {
							cosmeticBoxReward = CosmeticsLookup.CardSkin.FestiveZyx; // TODO: confirm this is the correct skin
							overrideSpiritRefundAmount = 30;
						} else if (dropSeed < 0.90) {
							cosmeticBoxReward = CosmeticsLookup.CardBack.Snowchaser; // TODO: confirm this is the correct cardback
							overrideSpiritRefundAmount = 30;
						} else if (dropSeed < 0.95) {
							cosmeticBoxReward = CosmeticsLookup.CardSkin.Faction3GeneralFestive; // TODO: confirm this is the correct cardback
							overrideSpiritRefundAmount = 30;
						} else {
							cosmeticBoxReward = CosmeticsLookup.CardSkin.Faction6GeneralFestive;
							overrideSpiritRefundAmount = 30;
						}

						allPromises.push(InventoryModule.giveUserCosmeticId(txPromise, tx, userId, cosmeticBoxReward, "gift crate reward", crateId,overrideSpiritRefundAmount, current_utc)
							.then(resValue=> {
								if (resValue.spirit != null) {
									return this.rewardsToReturn.push({
										cosmetic_id: resValue.cosmetic_id,
										spirit:	resValue.spirit
									});
								} else {
									return this.rewardsToReturn.push({
										cosmetic_id: resValue.cosmetic_id});
								}
						}));

//						@.rewardsToReturn.push
//							cosmetic_id: cosmeticBoxReward
					} else {
						return Promise.reject(new Errors.NotFoundError("No cosmetic box template for this gift crate type"));
					}
				}



				for (let reward of Array.from(rewardRows)) {
					allPromises.push(knex("user_rewards").insert(reward).transacting(tx));
				}

				this.rewards = rewardRows;

				return Promise.all(allPromises);}).then(function() {

				// Logger.module("GiftCrateModule").debug "unlockGiftCrate() -> reward rows #{util.inspect(@.rewards)}."

				this.giftCrateRow.rewards_claimed_at = current_utc.toDate();
				this.giftCrateRow.reward_ids = _.map(this.rewards,reward => reward.id);
				delete this.giftCrateRow.is_unread;

				return Promise.all([
					knex("user_gift_crates").where('crate_id',this.crateId).delete().transacting(tx),
					knex.insert(this.giftCrateRow).into("user_gift_crates_opened").transacting(tx)
				]);}).then(() => DuelystFirebase.connect().getRootRef())
			.then(fbRootRef => // leaving in until firebase is added for gift crates
            // boosters = fbRootRef.child("user-inventory").child(userId).child("spirit-orbs")
            // return FirebasePromises.remove(boosters.child(boosterPackId))

            Promise.resolve()).then(() => SyncModule._bumpUserTransactionCounter(tx,userId))
			.then(tx.commit)
			.catch(tx.rollback);
			}).bind(this_obj)
		.then(function(){

			Logger.module("GiftCrateModule").debug(`unlockGiftCrate() -> user ${userId.blue} `.green+` unlocked gift crate ${this.crateId}`.green);

			return Promise.resolve(this.rewardsToReturn);
		});
	}
}

module.exports = GiftCrateModule;
