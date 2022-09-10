/* eslint-disable
    import/no-unresolved,
    max-len,
    no-mixed-spaces-and-tabs,
    no-restricted-syntax,
    no-tabs,
    no-underscore-dangle,
    no-use-before-define,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const SpellKillTargetSpawnEntity = require('./spellKillTargetSpawnEntity');

class SpellWraithstorm extends SpellKillTargetSpawnEntity {
  static initClass() {
    this.prototype.radius = 1;
		 // default radius around general
  }

  _postFilterApplyPositions() {
    const board = this.getGameSession().getBoard();
    const myGeneral = this.getGameSession().getGeneralForPlayerId(this.getOwnerId());
    const filteredPositions = [];
    for (const unit of Array.from(board.getEntitiesAroundEntity(myGeneral, CardType.Unit, this.radius))) {
      if (!(__guard__(board.getUnitAtPosition(unit.getPosition()), (x) => x.getIsGeneral()))) { // don't transform generals
        filteredPositions.push(unit.getPosition());
      }
    }

    return filteredPositions;
  }
}
SpellWraithstorm.initClass();

module.exports = SpellWraithstorm;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
