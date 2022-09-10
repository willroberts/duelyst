/* eslint-disable
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
    no-undef,
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
const ModifierStunned = require('app/sdk/modifiers/modifierStunned');
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const Spell = require('./spell');

class SpellEssenceSculpt extends Spell {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const target = board.getUnitAtPosition({ x, y });

    // put a fresh card matching the original unit into hand
    const newCardData = target.createNewCardData();
    // add additional modifiers as needed
    if (this.targetModifiersContextObjects) {
      if (newCardData.additionalModifiersContextObjects != null) {
        newCardData.additionalModifiersContextObjects.concat(UtilsJavascript.deepCopy(this.targetModifiersContextObjects));
      } else {
        newCardData.additionalModifiersContextObjects = UtilsJavascript.deepCopy(this.targetModifiersContextObjects);
      }
    }

    const a = new PutCardInHandAction(this.getGameSession(), this.getOwnerId(), newCardData);
    return this.getGameSession().executeAction(a);
  }

  _postFilterPlayPositions(validPositions) {
    const filteredPositions = [];
    for (const position of Array.from(validPositions)) {
      const entityAtPosition = this.getGameSession().getBoard().getEntityAtPosition(position);
      if ((entityAtPosition != null) && entityAtPosition.hasModifierClass(ModifierStunned)) {
        filteredPositions.push(position);
      }
    }
    return filteredPositions;
  }
}

module.exports = SpellEssenceSculpt;
