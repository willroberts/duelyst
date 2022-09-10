/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const SpellApplyModifiers = require('./spellApplyModifiers');
const CardType = require('app/sdk/cards/cardType');
const SpellFilterType =	require('./spellFilterType');
const _ = require('underscore');

class SpellApplyModifiersToDamagedMinion extends SpellApplyModifiers {

	_postFilterPlayPositions(validPositions) {
		const damagedMinionsPositions = [];

		for (let position of Array.from(validPositions)) {
			const unit = this.getGameSession().getBoard().getUnitAtPosition(position);
			if ((unit != null) && (unit.getHP() < unit.getMaxHP())) {
				damagedMinionsPositions.push(position);
			}
		}

		return damagedMinionsPositions;
	}
}


module.exports = SpellApplyModifiersToDamagedMinion;
