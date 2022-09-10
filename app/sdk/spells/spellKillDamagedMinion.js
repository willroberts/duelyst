/* eslint-disable
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
const SpellKillTarget = require('./spellKillTarget');

class SpellKillDamagedMinion extends SpellKillTarget {
  _postFilterPlayPositions(validPositions) {
    const damagedMinionsPositions = [];

    for (const position of Array.from(validPositions)) {
      const unit = this.getGameSession().getBoard().getUnitAtPosition(position);
      if ((unit != null) && (unit.getHP() < unit.getMaxHP())) {
        damagedMinionsPositions.push(position);
      }
    }

    return damagedMinionsPositions;
  }
}

module.exports = SpellKillDamagedMinion;
