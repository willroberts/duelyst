/* eslint-disable
    consistent-return,
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
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const Modifier = require('./modifier');
const ModifierDeathWatch = require('./modifierDeathWatch');

class ModifierDeathWatchBuffRandomMinionInHand extends ModifierDeathWatch {
  static initClass() {
    this.prototype.type = 'ModifierDeathWatchBuffRandomMinionInHand';
    this.type = 'ModifierDeathWatchBuffRandomMinionInHand';

    this.description = 'Give a minion in your hand %X';

    this.prototype.fxResource = ['FX.Modifiers.ModifierDeathwatch', 'FX.Modifiers.ModifierGenericBuff'];

    this.prototype.modifiersContextObjects = null;
  }

  static createContextObject(modifiersContextObjects, description, options) {
    const contextObject = super.createContextObject(options);
    contextObject.modifiersContextObjects = modifiersContextObjects;
    contextObject.description = description;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return this.description.replace(/%X/, modifierContextObject.description);
    }
    return this.description;
  }

  onDeathWatch(action) {
    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      const possibleMinions = [];
      for (const card of Array.from(this.getCard().getOwner().getDeck().getCardsInHandExcludingMissing())) {
        if (card.getType() === CardType.Unit) {
          possibleMinions.push(card);
        }
      }
      if (possibleMinions.length > 0) {
        const cardToBuff = possibleMinions[this.getGameSession().getRandomIntegerForExecution(possibleMinions.length)];
        return Array.from(this.modifiersContextObjects).map((modifierContextObject) => this.getGameSession().applyModifierContextObject(modifierContextObject, cardToBuff));
      }
    }
  }
}
ModifierDeathWatchBuffRandomMinionInHand.initClass();

module.exports = ModifierDeathWatchBuffRandomMinionInHand;
