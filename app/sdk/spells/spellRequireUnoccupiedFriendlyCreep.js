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
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const Spell = require('./spell');

class SpellRequireUnoccupiedFriendlyCreep extends Spell {
  _postFilterPlayPositions(spellPositions) {
    const board = this.getGameSession().getBoard();

    for (const tile of Array.from(board.getTiles(true, false))) {
      if ((tile.getOwnerId() === this.getOwnerId()) && (tile.getBaseCardId() === Cards.Tile.Shadow)) {
        const tilePosition = { x: tile.getPosition().x, y: tile.getPosition().y };
        if (!board.getCardAtPosition(tilePosition, CardType.Unit)) {
          // there is at least 1 unoccupied friendly creep tile
          return super._postFilterPlayPositions(spellPositions);
        }
      }
    }

    // No unoccupied friendly creep
    return [];
  }
}

module.exports = SpellRequireUnoccupiedFriendlyCreep;
