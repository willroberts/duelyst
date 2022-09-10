/* eslint-disable
    import/no-unresolved,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const ModifierBackstab = require('app/sdk/modifiers/modifierBackstab');
const SpellApplyModifiersToUnitsInHand = require('./spellApplyModifiersToUnitsInHand');

class SpellShadowWaltz extends SpellApplyModifiersToUnitsInHand {
  getCardsAffected() {
    const potentialCards = super.getCardsAffected();
    const finalCards = [];
    for (const card of Array.from(potentialCards)) {
      if ((card != null) && card.hasModifierType(ModifierBackstab.type)) {
        finalCards.push(card);
      }
    }

    return finalCards;
  }
}

module.exports = SpellShadowWaltz;
