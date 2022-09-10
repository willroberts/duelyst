/* eslint-disable
    max-len,
    no-restricted-syntax,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const SpellFollowupTeleportMyGeneral =	require('./spellFollowupTeleportMyGeneral');

class SpellFollowupTeleportMyGeneralBehindEnemy extends SpellFollowupTeleportMyGeneral {
  getFollowupSourcePattern() {
    const board = this.getGameSession().getBoard();
    const behindPositions = [];
    // apply behind each enemy unit and General
    let playerOffset = 0;
    if (this.isOwnedByPlayer1()) { playerOffset = 1; } else { playerOffset = -1; }
    const entity = this.getGameSession().getGeneralForPlayerId(this.getOwnerId());
    for (const unit of Array.from(board.getUnits())) {
      // look for units owned by the opponent of the player who cast the spell, and with an open space "behind" the enemy unit
      const behindPosition = { x: unit.getPosition().x + playerOffset, y: unit.getPosition().y };
      if ((unit.getOwnerId() !== this.getOwnerId()) && board.isOnBoard(behindPosition) && !board.getObstructionAtPositionForEntity(behindPosition, entity)) {
        behindPositions.push(behindPosition);
      }
    }

    const patternBehindEnemies = [];
    for (const position of Array.from(behindPositions)) {
      patternBehindEnemies.push({ x: position.x - this.getFollowupSourcePosition().x, y: position.y - this.getFollowupSourcePosition().y });
    }

    return patternBehindEnemies;
  }

  getTeleportSourcePosition(applyEffectPosition) {
    return this.getGameSession().getGeneralForPlayerId(this.getOwnerId()).getPosition();
  }
}

module.exports = SpellFollowupTeleportMyGeneralBehindEnemy;
