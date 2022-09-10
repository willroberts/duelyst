/* eslint-disable
    import/no-unresolved,
    no-param-reassign,
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
const Logger = require('app/common/logger');
const ModifierStunned = require('app/sdk/modifiers/modifierStunned');
const SpellKillTarget = require('./spellKillTarget');

class SpellKillTargetWithModifierStunned extends SpellKillTarget {
  _postFilterPlayPositions(validPositions) {
    // use super filter play positions
    validPositions = super._postFilterPlayPositions(validPositions);
    const filteredValidPositions = [];

    for (const position of Array.from(validPositions)) {
      const unit = this.getGameSession().getBoard().getUnitAtPosition(position);
      if ((unit != null) && unit.hasActiveModifierClass(ModifierStunned)) {
        filteredValidPositions.push(position);
      }
    }

    return filteredValidPositions;
  }
}

module.exports = SpellKillTargetWithModifierStunned;
