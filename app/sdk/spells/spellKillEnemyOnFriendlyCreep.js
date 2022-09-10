/* eslint-disable
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const SpellKillTarget = require('./spellKillTarget');

class SpellKillEnemyOnFriendlyCreep extends SpellKillTarget {
  _postFilterPlayPositions(spellPositions) {
    const board = this.getGameSession().getBoard();
    const possibleTargetPositions = [];

    for (const tile of Array.from(board.getTiles(true, false))) {
      if ((tile.getOwnerId() === this.getOwnerId()) && (tile.getBaseCardId() === Cards.Tile.Shadow)) {
        const tilePosition = { x: tile.getPosition().x, y: tile.getPosition().y };
        const unitOnCreep = board.getCardAtPosition(tilePosition, CardType.Unit);
        if ((unitOnCreep != null) && (unitOnCreep.getOwnerId() !== this.getOwnerId()) && !unitOnCreep.getIsGeneral()) {
          possibleTargetPositions.push(tilePosition);
        }
      }
    }

    return possibleTargetPositions;
  }
}

module.exports = SpellKillEnemyOnFriendlyCreep;
