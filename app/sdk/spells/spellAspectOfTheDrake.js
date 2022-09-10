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
const ModifierFlying = require('app/sdk/modifiers/modifierFlying');
const CardType = require('app/sdk/cards/cardType');
const _ = require('underscore');
const SpellAspectBase = require('./spellAspectBase');

class SpellAspectOfTheDrake extends SpellAspectBase {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction); // transform target into a frost drake

    // apply flying modifier to friendly units around original target position
    const applyEffectPosition = { x, y };
    return (() => {
      const result = [];
      for (const entity of Array.from(board.getCardsWithinRadiusOfPosition(applyEffectPosition, CardType.Unit, 1, false))) {
        if (entity.getOwnerId() === this.getOwnerId()) { // friendly (based on spell caster) unit around target unit
          if (!entity.getIsGeneral()) { // don't apply to Generals
            result.push(this.getGameSession().applyModifierContextObject(ModifierFlying.createContextObject(), entity));
          } else {
            result.push(undefined);
          }
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}

module.exports = SpellAspectOfTheDrake;
