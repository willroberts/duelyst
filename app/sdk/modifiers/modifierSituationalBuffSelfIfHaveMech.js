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
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Races = require('app/sdk/cards/racesLookup');
const CardType = require('app/sdk/cards/cardType');
const ModifierSituationalBuffSelf = require('./modifierSituationalBuffSelf');

class ModifierSituationalBuffSelfIfHaveMech extends ModifierSituationalBuffSelf {
  static initClass() {
    this.prototype.type = 'ModifierSituationalBuffSelfIfHaveMech';
    this.type = 'ModifierSituationalBuffSelfIfHaveMech';

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;
  }

  static createContextObject(modifierContextObjects, options) {
    const contextObject = super.createContextObject(options);
    contextObject.modifiersContextObjects = modifierContextObjects;
    return contextObject;
  }

  getIsSituationActiveForCache() {
    const friendlyMinions = this.getGameSession().getBoard().getFriendlyEntitiesForEntity(this.getCard(), CardType.Unit, true, false);
    if (friendlyMinions != null) {
      for (const minion of Array.from(friendlyMinions)) {
        if ((minion != null) && minion.getBelongsToTribe(Races.Mech)) {
          return true;
        }
      }
    }
    return false;
  }
}
ModifierSituationalBuffSelfIfHaveMech.initClass();

module.exports = ModifierSituationalBuffSelfIfHaveMech;
