/* eslint-disable
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
    no-tabs,
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
const ModifierStunned = 		require('app/sdk/modifiers/modifierStunned');
const SpellApplyModifiers = require('./spellApplyModifiers');

class SpellYellRealLoud extends SpellApplyModifiers {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const applyEffectPosition = { x, y };

    const targetEntity = board.getUnitAtPosition(applyEffectPosition);

    const entities = board.getEnemyEntitiesAroundEntity(targetEntity, CardType.Unit, 1);
    return (() => {
      const result = [];
      for (const entity of Array.from(entities)) {
        if (!entity.getIsGeneral()) {
          result.push(this.getGameSession().applyModifierContextObject(ModifierStunned.createContextObject(), entity));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}

module.exports = SpellYellRealLoud;
