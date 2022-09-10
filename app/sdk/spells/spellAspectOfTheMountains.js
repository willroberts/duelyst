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
const DamageAction = require('app/sdk/actions/damageAction');
const _ = require('underscore');
const SpellAspectBase = require('./spellAspectBase');

class SpellAspectOfTheMountains extends SpellAspectBase {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction); // transform target into a seismic elemental

    // damage ALL nearby minions around target location
    const applyEffectPosition = { x, y };
    return (() => {
      const result = [];
      for (const entity of Array.from(board.getCardsWithinRadiusOfPosition(applyEffectPosition, CardType.Unit, 1, false))) {
        if (!entity.getIsGeneral() && (entity.getOwnerId() !== this.getOwnerId())) { // don't damage Generals or friendly units
          const damageAction = new DamageAction(this.getGameSession());
          damageAction.setOwnerId(this.ownerId);
          damageAction.setTarget(entity);
          damageAction.setDamageAmount(this.damageAmount);
          result.push(this.getGameSession().executeAction(damageAction));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}

module.exports = SpellAspectOfTheMountains;
