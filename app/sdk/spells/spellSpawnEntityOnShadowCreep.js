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
const Cards = require('app/sdk/cards/cardsLookupComplete');
const SpellSpawnEntity = require('./spellSpawnEntity');

class SpellSpawnEntityOnShadowCreep extends SpellSpawnEntity {
  _findApplyEffectPositions(position, sourceAction) {
    // filter to only positions with Shadow Creep
    const finalPositions = [];
    const board = this.getGameSession().getBoard();
    const entityToSpawn = this.getEntityToSpawn();
    for (const tile of Array.from(board.getTiles(true))) {
      if ((tile != null) && (tile.getBaseCardId() === Cards.Tile.Shadow) && (tile.getOwnerId() === this.getOwnerId())) {
        const pos = tile.getPosition();
        if (!board.getObstructionAtPositionForEntity(pos, entityToSpawn)) {
          finalPositions.push(pos);
        }
      }
    }

    return finalPositions;
  }
}

module.exports = SpellSpawnEntityOnShadowCreep;
