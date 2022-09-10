/* eslint-disable
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const ModifierHealWatch = require('./modifierHealWatch');

class ModifierHealWatchPutCardInHand extends ModifierHealWatch {
  static initClass() {
    this.prototype.type = 'ModifierHealWatchPutCardInHand';
    this.type = 'ModifierHealWatchPutCardInHand';

    this.modifierName = 'ModifierHealWatchPutCardInHand';
    this.description = 'Whenever anything is healed, put %X into your action bar';

    this.prototype.fxResource = ['FX.Modifiers.ModifierFriendlyMinionHealWatch'];
  }

  static createContextObject(cardDataOrIndexToPutInHand, cardDescription, options) {
    const contextObject = super.createContextObject(options);
    contextObject.cardDataOrIndexToPutInHand = cardDataOrIndexToPutInHand;
    contextObject.cardDescription = cardDescription;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return this.description.replace(/%X/, modifierContextObject.cardDescription);
    }
    return this.description;
  }

  onHealWatch(action) {
    const a = new PutCardInHandAction(this.getGameSession(), this.getCard().getOwnerId(), this.cardDataOrIndexToPutInHand);
    return this.getGameSession().executeAction(a);
  }
}
ModifierHealWatchPutCardInHand.initClass();

module.exports = ModifierHealWatchPutCardInHand;
