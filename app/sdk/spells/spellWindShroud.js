/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('../../common/config');
const SpellSpawnEntity = require('./spellSpawnEntity.coffee');
const CardType = require('./../cards/cardType.coffee');
const Cards = require('../cards/cardsLookupComplete.coffee');
const UtilsGameSession = require('../../common/utils/utils_game_session.coffee');
const _ = require('underscore');

class SpellWindShroud extends SpellSpawnEntity {
	static initClass() {
	
		this.prototype.targetType = CardType.Unit;
		this.prototype.spawnSilently = true;
		this.prototype.cardDataOrIndexToSpawn = {id: Cards.Faction3.IronDervish};
		 // spawns dervishes
	}

	_findApplyEffectPositions(position, sourceAction) {
		const card = this.getEntityToSpawn();
		const generalPosition = this.getGameSession().getGeneralForPlayerId(this.ownerId).getPosition();
		const applyEffectPositions = UtilsGameSession.getRandomSmartSpawnPositionsFromPattern(this.getGameSession(), generalPosition, CONFIG.PATTERN_3x3, card, this, 1);

		return applyEffectPositions;
	}

	// Wind Shroud picks its apply location by itself, so don't set limits on where it can be cast
	_postFilterPlayPositions(validPositions) {
		return validPositions;
	}
}
SpellWindShroud.initClass();

module.exports = SpellWindShroud;
