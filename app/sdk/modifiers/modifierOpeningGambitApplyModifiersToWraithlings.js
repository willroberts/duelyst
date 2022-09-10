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
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const ModifierOpeningGambitApplyModifiers = require('./modifierOpeningGambitApplyModifiers');

class ModifierOpeningGambitApplyModifiersToWraithlings extends ModifierOpeningGambitApplyModifiers {
  static initClass() {
    this.prototype.type = 'ModifierOpeningGambitApplyModifiersToWraithlings';
    this.type = 'ModifierOpeningGambitApplyModifiersToWraithlings';

    this.description = '';

    this.prototype.fxResource = ['FX.Modifiers.ModifierOpeningGambit', 'FX.Modifiers.ModifierGenericBuff'];
  }

  static createContextObject(modifiersContextObjects, auraRadius, description, options) {
    const contextObject = super.createContextObject(modifiersContextObjects, false, false, true, false, false, auraRadius, description, options);
    contextObject.cardId = Cards.Faction4.Wraithling;
    return contextObject;
  }

  getAffectedEntities(action) {
    const affectedEntities = [];
    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      const potentialAffectedEntities = super.getAffectedEntities(action);
      for (const entity of Array.from(potentialAffectedEntities)) {
        if (entity.getBaseCardId() === this.cardId) {
          affectedEntities.push(entity);
        }
      }
    }
    return affectedEntities;
  }
}
ModifierOpeningGambitApplyModifiersToWraithlings.initClass();

module.exports = ModifierOpeningGambitApplyModifiersToWraithlings;
