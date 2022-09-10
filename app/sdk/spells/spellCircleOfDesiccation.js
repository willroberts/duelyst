/* eslint-disable
    class-methods-use-this,
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
const Races = require('app/sdk/cards/racesLookup');
const SpellKillTarget = require('./spellKillTarget');

class SpellCircleOfDesiccation extends SpellKillTarget {
  _findApplyEffectPositions(position, sourceAction) {
    const potentialApplyEffectPositions = super._findApplyEffectPositions(position, sourceAction);
    const applyEffectPositions = [];
    const board = this.getGameSession().getBoard();

    // apply to non-structures
    for (position of Array.from(potentialApplyEffectPositions)) {
      const unit = board.getUnitAtPosition(position);
      if (!(unit != null ? unit.getBelongsToTribe(Races.Structure) : undefined)) {
        applyEffectPositions.push(position);
      }
    }

    return applyEffectPositions;
  }

  getAppliesSameEffectToMultipleTargets() {
    return true;
  }
}

module.exports = SpellCircleOfDesiccation;
