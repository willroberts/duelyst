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
const SpellFollowupTeleport = require('./spellFollowupTeleport');

class SpellFollowupTeleportToFriendlyCreep extends SpellFollowupTeleport {
  _postFilterPlayPositions(spellPositions) {
    const board = this.getGameSession().getBoard();
    const friendlyCreepPositions = [];

    for (const tile of Array.from(board.getTiles(true, false))) {
      if ((tile.getOwnerId() === this.getOwnerId()) && (tile.getBaseCardId() === Cards.Tile.Shadow)) {
        const tilePosition = { x: tile.getPosition().x, y: tile.getPosition().y };
        if (!board.getCardAtPosition(tilePosition, CardType.Unit)) {
          friendlyCreepPositions.push(tilePosition);
        }
      }
    }

    return friendlyCreepPositions;
  }
}

module.exports = SpellFollowupTeleportToFriendlyCreep;
