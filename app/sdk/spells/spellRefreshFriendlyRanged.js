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
const ModifierRanged = require('app/sdk/modifiers/modifierRanged');
const SpellRefreshExhaustion = require('./spellRefreshExhaustion');

class SpellRefreshFriendlyRanged extends SpellRefreshExhaustion {
  _postFilterApplyPositions(validPositions) {
    const filteredPositions = [];

    const board = this.getGameSession().getBoard();
    for (const unit of Array.from(board.getUnits(true, false))) {
      if (((unit != null ? unit.getOwnerId() : undefined) === this.getOwnerId()) && !unit.getIsGeneral() && unit.hasActiveModifierClass(ModifierRanged)) {
        const position = unit.getPosition();
        filteredPositions.push(position);
      }
    }

    return filteredPositions;
  }
}

module.exports = SpellRefreshFriendlyRanged;
