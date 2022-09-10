/* eslint-disable
    consistent-return,
    import/no-unresolved,
    no-restricted-syntax,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Cards = require('app/sdk/cards/cardsLookupComplete');
const ModifierEgg = require('app/sdk/modifiers/modifierEgg');
const Spell = require('./spell');

class SpellHatchAnEgg extends Spell {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);
    const eggModifier = board.getCardAtPosition({ x, y }).getModifierByClass(ModifierEgg);
    if (eggModifier != null) {
      this.getGameSession().pushTriggeringModifierOntoStack(eggModifier);
      eggModifier.removeAndReplace();
      return this.getGameSession().popTriggeringModifierFromStack();
    }
  }

  _postFilterPlayPositions(validPositions) {
    // playable anywhere where an egg exists
    // but NOT a dispelled egg (dispelled egg cannot hatch)
    const filteredPositions = [];
    for (const position of Array.from(validPositions)) {
      const entityAtPosition = this.getGameSession().getBoard().getEntityAtPosition(position);
      if ((entityAtPosition != null) && entityAtPosition.hasModifierClass(ModifierEgg)) {
        filteredPositions.push(position);
      }
    }
    return filteredPositions;
  }
}

module.exports = SpellHatchAnEgg;
