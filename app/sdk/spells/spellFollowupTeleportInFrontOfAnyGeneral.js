/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const SpellFollowupTeleport = require('./spellFollowupTeleport');

class SpellFollowupTeleportInFrontOfAnyGeneral extends SpellFollowupTeleport {

	getFollowupSourcePattern() {
		const board = this.getGameSession().getBoard();
		const inFrontOfPositions = [];
		for (let unit of Array.from(board.getUnits())) {
			// apply in front of any General
			let playerOffset = 0;
			if (unit.getIsGeneral()) {
				if (unit.isOwnedByPlayer1()) { playerOffset = 1; } else { playerOffset = -1; }
				const entity = this.getGameSession().getGeneralForPlayerId(this.getOwnerId());
				const inFrontOfPosition = {x:unit.getPosition().x+playerOffset, y:unit.getPosition().y};
				if (board.isOnBoard(inFrontOfPosition) && !board.getObstructionAtPositionForEntity(inFrontOfPosition, entity)) {
					inFrontOfPositions.push(inFrontOfPosition);
				}
			}
		}

		const paternInFrontOfGenerals = [];
		for (let position of Array.from(inFrontOfPositions)) {
			paternInFrontOfGenerals.push({x: position.x - this.getFollowupSourcePosition().x, y: position.y - this.getFollowupSourcePosition().y});
		}

		return paternInFrontOfGenerals;
	}
}

module.exports = SpellFollowupTeleportInFrontOfAnyGeneral;
