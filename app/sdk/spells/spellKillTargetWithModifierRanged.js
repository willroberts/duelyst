/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Logger = require('app/common/logger');
const SpellKillTarget = require('./spellKillTarget');
const ModifierRanged = require('app/sdk/modifiers/modifierRanged');

class SpellKillTargetWithModifierRanged extends SpellKillTarget {

	_postFilterPlayPositions(validPositions) {
		// use super filter play positions
		validPositions = super._postFilterPlayPositions(validPositions);
		const filteredValidPositions = [];

		for (let position of Array.from(validPositions)) {
			const unit = this.getGameSession().getBoard().getUnitAtPosition(position);
			if ((unit != null) && unit.hasActiveModifierClass(ModifierRanged)) {
				filteredValidPositions.push(position);
			}
		}

		return filteredValidPositions;
	}
}

module.exports = SpellKillTargetWithModifierRanged;
