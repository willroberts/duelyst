/* eslint-disable
    import/extensions,
    import/no-unresolved,
    max-len,
    no-param-reassign,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Promise = require('bluebird');
const _ = require('underscore');
const util = require('util');
const colors = require('colors');
const moment = require('moment');
const crypto = require('crypto');
const Logger = require('../../../app/common/logger.coffee');
const mail = require('../../mailer');
const knex = require('./knex');
const InventoryModule = require('./inventory');
const config = require('../../../config/config.js');
const generatePushId = require('../../../app/common/generate_push_id');

Promise.promisifyAll(mail);

// SDK imports
const SDK = require('../../../app/sdk');
const UtilsGameSession = require('../../../app/common/utils/utils_game_session.coffee');

class DecksModule {
  /**
	 * Retrieve all user decks
	 * @public
	 * @param	{String}		userId			User ID.
	 * @return	{Promise}
	 */
  static decksForUser(userId) {
    return knex('user_decks').where('user_id', userId).select();
  }

  /**
	 * Add a new deck for a user
	 * @public
	 * @param	{String}		userId			User ID.
	 * @param	{String}		deckId			Deck ID.
	 * @param	{String}		name			Name for deck.
	 * @param	{Array}			cards			Array of Card IDs to update deck with
	 * @param	{Number}			spellCount			number of spells
	 * @param	{Number}			minionCount			number of minions
	 * @param	{Number}			artifactCount		number of artifacts
	 * @param	{Number}			colorCode		color code
	 * @param	{Number}			cardBackId		card back id
	 * @return	{Promise}
	 */
  static addDeck(userId, factionId, name, cards, spellCount, minionCount, artifactCount, colorCode, cardBackId) {
    let isAllowedToUseCardBackPromise;
    const MOMENT_NOW_UTC = moment().utc();

    const newDeckData = {
      id: generatePushId(),
      user_id: userId,
      name,
      faction_id: factionId,
      cards,
      spell_count: spellCount,
      minion_count: minionCount,
      artifact_count: artifactCount,
      color_code: colorCode,
      card_back_id: cardBackId,
      created_at: MOMENT_NOW_UTC.toDate(),
    };

    if (cardBackId != null) {
      isAllowedToUseCardBackPromise = InventoryModule.isAllowedToUseCosmetic(Promise.resolve(), knex, userId, cardBackId);
    } else {
      isAllowedToUseCardBackPromise = Promise.resolve();
    }

    return isAllowedToUseCardBackPromise
      .bind({})
      .then(() => knex('user_decks').insert(newDeckData)).then(() => newDeckData);
  }

  /**
	 * Update a user's deck
	 * @public
	 * @param	{String}		userId			User ID.
	 * @param	{String}		deckId			Deck ID.
	 * @param	{String}		name			Name for deck.
	 * @param	{Array}			cards			Array of Card IDs to update deck with
	 * @param	{Number}			spellCount			number of spells
	 * @param	{Number}			minionCount			number of minions
	 * @param	{Number}			artifactCount		number of artifacts
	 * @param	{Number}			colorCode		color code
	 * @param	{Number}			cardBackId		card back id
	 * @return	{Promise}
	 */
  static updateDeck(userId, deckId, factionId, name, cards, spellCount, minionCount, artifactCount, colorCode, cardBackId) {
    let isAllowedToUseCardBackPromise;
    const MOMENT_NOW_UTC = moment().utc();

    const newDeckData = {
      name,
      faction_id: factionId,
      cards,
      spell_count: spellCount,
      minion_count: minionCount,
      artifact_count: artifactCount,
      color_code: colorCode,
      card_back_id: cardBackId,
      updated_at: MOMENT_NOW_UTC.toDate(),
    };

    if (cardBackId != null) {
      isAllowedToUseCardBackPromise = InventoryModule.isAllowedToUseCosmetic(Promise.resolve(), knex, userId, cardBackId);
    } else {
      isAllowedToUseCardBackPromise = Promise.resolve();
    }

    return isAllowedToUseCardBackPromise
      .bind({})
      .then(() => knex('user_decks').where({ user_id: userId, id: deckId }).update(newDeckData)).then(() => newDeckData);
  }

  /**
	 * Generate a short digest for a list of card IDs.
	 * Method is to generate a string message M and grab first 16 bits of AES-CTR(SHA256(M)) and output as hex.
	 * @public
	 * @param	{Array}			cards			Array of Integer Card IDs to update deck with
	 * @param	{String}		salt			User based salt
	 * @return	{String}
	 */
  static hashForDeck(cards, salt) {
    if (salt == null) { salt = ''; }
    if (!cards) {
      return null;
    }

    const baseCardIds = _.map(cards, (card) => SDK.Cards.getBaseCardId(card));

    const sortedCardIds = baseCardIds.sort();

    const val = sortedCardIds.join(',') + salt;

    const hash = crypto.createHash('sha256');
    const cipher = crypto.createCipher('aes-256-ctr', 'dcDnVgALT39spZb');

    Logger.module('DecksModule').debug(`hashCodeForDeck() -> generating hash for ${sortedCardIds}`);

    hash.update(val);
    const digest = hash.digest('hex');
    Logger.module('DecksModule').debug(`hashCodeForDeck() -> digest: ${digest}`);

    let crypted = cipher.update(digest, 'utf8', 'hex');
    crypted += cipher.final('hex');
    Logger.module('DecksModule').debug(`hashCodeForDeck() -> crypted: ${crypted}`);

    const final = crypted.slice(0, 18);
    Logger.module('DecksModule').debug(`hashCodeForDeck() -> final: ${final}`);

    return final;
  }
}

module.exports = DecksModule;
