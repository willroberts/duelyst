/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Cards = require('app/sdk/cards/cardsLookupComplete');
const ModifierEphemeral = require('app/sdk/modifiers/modifierEphemeral');
const SpellApplyModifiers = require('./spellApplyModifiers');

class SpellDunecasterFollowup extends SpellApplyModifiers {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction); // apply the modifiers passed in from card factory

    // special rules: if target is a Dervish token unit, also make it not disapear at end of turn
    const targetUnit = board.getUnitAtPosition({ x, y });
    if (targetUnit.getBaseCardId() === Cards.Faction3.Dervish) {
      // remove ephemeral modifiers
      return Array.from(targetUnit.getModifiersByClass(ModifierEphemeral)).map((mod) => this.getGameSession().removeModifier(mod));
    }
  }
}

module.exports = SpellDunecasterFollowup;
