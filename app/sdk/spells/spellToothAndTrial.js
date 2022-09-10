/* eslint-disable
    consistent-return,
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Modifier = require('app/sdk/modifiers/modifier');
const SpellSilence = require('./spellSilence');

class SpellToothAndTrial extends SpellSilence {
  getPrivateDefaults(gameSession) {
    const p = super.getPrivateDefaults(gameSession);
    p.targetsSpace = true; // does not target any unit directly
    return p;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction); // dispel the space

    const applyEffectPosition = { x, y };
    const unit = board.getUnitAtPosition(applyEffectPosition);
    if ((unit != null) && !unit.getIsGeneral()) {
      const modifierContextObject = Modifier.createContextObjectWithAttributeBuffs(2, 2);
      modifierContextObject.appliedName = 'Primitive Strength';
      return this.getGameSession().applyModifierContextObject(modifierContextObject, unit);
    }
  }
}

module.exports = SpellToothAndTrial;
