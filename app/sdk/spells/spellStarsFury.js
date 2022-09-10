/* eslint-disable
    class-methods-use-this,
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
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('app/common/config');
const CardType = require('app/sdk/cards/cardType');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const SpellSpawnEntity = require('./spellSpawnEntity');
const SpellFilterType = require('./spellFilterType');

class SpellStarsFury extends SpellSpawnEntity {
  static initClass() {
    this.prototype.cardDataOrIndexToSpawn = { id: Cards.Faction3.Dervish };
  }

  _findApplyEffectPositions(position, sourceAction) {
    const applyEffectPositions = [];
    const board = this.getGameSession().getBoard();

    // apply in front of each enemy unit and General
    let playerOffset = 0;
    if (this.isOwnedByPlayer1()) { playerOffset = -1; } else { playerOffset = 1; }
    const entity = this.getEntityToSpawn();
    for (const unit of Array.from(board.getUnits())) {
      // look for units owned by the opponent of the player who cast the spell, and with an open space "in front" of the enemy unit
      const inFrontOfPosition = { x: unit.getPosition().x + playerOffset, y: unit.getPosition().y };
      if ((unit.getOwnerId() !== this.getOwnerId()) && board.isOnBoard(inFrontOfPosition) && !board.getObstructionAtPositionForEntity(inFrontOfPosition, entity)) {
        applyEffectPositions.push(inFrontOfPosition);
      }
    }

    return applyEffectPositions;
  }

  getAppliesSameEffectToMultipleTargets() {
    return true;
  }
}
SpellStarsFury.initClass();

module.exports = SpellStarsFury;
