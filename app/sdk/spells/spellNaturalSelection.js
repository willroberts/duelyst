/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Logger = require('app/common/logger');
const CONFIG = require('app/common/config');
const SpellKillTarget = require('./spellKillTarget');

/*
  Spell that kills any 1 unit with lowest attack anywhere on the board (your choice which one when tied).
*/
class SpellNaturalSelection extends SpellKillTarget {

	_postFilterPlayPositions(validPositions) {
		// use super filter play positions
		validPositions = super._postFilterPlayPositions(validPositions);
		let filteredValidPositions = [];

		// find all units with lowest attack value on the board
		let lowestAttack = CONFIG.INFINITY;
		for (let position of Array.from(validPositions)) {
			const unit = this.getGameSession().getBoard().getUnitAtPosition(position);
			if (unit != null) {
				const atk = unit.getATK();
				if (atk < lowestAttack) {
					lowestAttack = atk;
					// reset list of valid positions starting with the first unit that has the lowest atk
					filteredValidPositions = [unit.getPosition()];
				} else if (atk === lowestAttack) {
					// add unit position to valid positions as this unit matches current lowest atk
					filteredValidPositions.push(unit.getPosition());
				}
			}
		}

		return filteredValidPositions;
	}
}


module.exports = SpellNaturalSelection;
