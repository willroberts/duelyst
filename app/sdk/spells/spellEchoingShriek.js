/* eslint-disable
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
const SpellAspectBase = require('./spellAspectBase');

class SpellEchoingShriek extends SpellAspectBase {
  static initClass() {
    module.exports = SpellEchoingShriek;
  }

  _postFilterApplyPositions(validPositions) {
    const filteredPositions = [];

    if (validPositions.length > 0) {
      // spell only applies to minions with 2 or less cost
      for (const position of Array.from(validPositions)) {
        if (this.getGameSession().getBoard().getUnitAtPosition(position).getManaCost() <= 2) {
          filteredPositions.push(position);
        }
      }
    }

    return filteredPositions;
  }
}
SpellEchoingShriek.initClass();
