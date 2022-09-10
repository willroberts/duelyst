/* eslint-disable
    import/no-unresolved,
    no-restricted-syntax,
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
const Logger = require('app/common/logger');
const SpellEnslave = require('./spellEnslave');

class SpellMindControlByAttackValue extends SpellEnslave {
  static initClass() {
    this.prototype.maxAttack = -1;
  }

  _postFilterPlayPositions(validPositions) {
    const validTargetPositions = [];

    if (this.maxAttack >= 0) { // if maxAttack < 0, then don't any enemy unit is a valid target
      for (const position of Array.from(validPositions)) {
        const unit = this.getGameSession().getBoard().getUnitAtPosition(position);
        if ((unit != null) && (unit.getATK() <= this.maxAttack)) {
          validTargetPositions.push(position);
        }
      }
    }

    return validTargetPositions;
  }
}
SpellMindControlByAttackValue.initClass();

module.exports = SpellMindControlByAttackValue;
