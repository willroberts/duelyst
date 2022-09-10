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
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const ModifierWraithlingFury = require('app/sdk/modifiers/modifierWraithlingFury');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const SpellShadowspawn = require('./spellShadowspawn');

class SpellFuriousLings extends SpellShadowspawn {
  getCardDataOrIndexToSpawn(x, y) {
    const cardDataOrIndexToSpawn = super.getCardDataOrIndexToSpawn(x, y);
    if (cardDataOrIndexToSpawn.additionalModifiersContextObjects == null) { cardDataOrIndexToSpawn.additionalModifiersContextObjects = []; }
    cardDataOrIndexToSpawn.additionalModifiersContextObjects.push(ModifierWraithlingFury.createContextObject());
    return cardDataOrIndexToSpawn;
  }

  onApplyOneEffectToBoard(board, x, y, sourceAction) {
    // make all your existing Wraithlings furious
    return (() => {
      const result = [];
      for (const unit of Array.from(board.getUnits())) {
        if ((unit != null) && (unit.getBaseCardId() === Cards.Faction4.Wraithling) && (unit.getOwnerId() === this.getOwnerId())) {
          if (!unit.hasModifierType(ModifierWraithlingFury.type)) {
            result.push(this.getGameSession().applyModifierContextObject(ModifierWraithlingFury.createContextObject(), unit));
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

module.exports = SpellFuriousLings;
