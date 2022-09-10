/* eslint-disable
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const SpellApplyModifiers = require('./spellApplyModifiers');

class SpellVoidSteal extends SpellApplyModifiers {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction); // apply modifier to target unit

    // then apply friendly modifier to friendly units nearby the target
    return (() => {
      const result = [];
      for (const unit of Array.from(this.getGameSession().getBoard().getCardsAroundPosition({ x, y }, CardType.Unit, 1))) {
        if (!unit.getIsGeneral() && (unit.getOwnerId() === this.getOwnerId())) {
          result.push(this.getGameSession().applyModifierContextObject(this.allyBuffContextObject, unit));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}

module.exports = SpellVoidSteal;
