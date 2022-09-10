/* eslint-disable
    class-methods-use-this,
    import/no-unresolved,
    max-len,
    no-mixed-spaces-and-tabs,
    no-restricted-syntax,
    no-tabs,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const Spell = 	require('./spell');
const SpellFilterType = require('./spellFilterType');

/*
  Abstract class that should be the super class for ANY spell that applies entities to the board.
*/
class SpellApplyEntityToBoard extends Spell {
  static initClass() {
    this.prototype.sourceType = CardType.Entity;
    this.prototype.targetType = CardType.Entity;
    this.prototype.spellFilterType = SpellFilterType.None;
    this.prototype.filterPlayPositionsForEntity = true;
		 // by default SpellApplyEntity blocks play positions where the spawning entity would be obstructed
  }

  getEntityToSpawn() {
    // override in subclasses and provide entity that will be applied to board
    return null;
  }

  _postFilterPlayPositions(validPositions) {
    if (this.filterPlayPositionsForEntity) {
      const entity = this.getEntityToSpawn();
      if (entity != null) {
        const filteredPositions = [];
        for (const position of Array.from(validPositions)) {
          if (!this.getGameSession().getBoard().getObstructionAtPositionForEntity(position, entity)) {
            filteredPositions.push(position);
          }
        }
        return filteredPositions;
      }
      return super._postFilterPlayPositions(validPositions);
    }
    return super._postFilterPlayPositions(validPositions);
  }
}
SpellApplyEntityToBoard.initClass();

module.exports = SpellApplyEntityToBoard;
