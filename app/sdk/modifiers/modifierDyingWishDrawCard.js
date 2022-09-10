/* eslint-disable
    import/no-unresolved,
    max-len,
    no-param-reassign,
    no-plusplus,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Cards = require('app/sdk/cards/cardsLookupComplete');
const CardType = require('app/sdk/cards/cardType');
const ModifierDyingWish = 	require('./modifierDyingWish');

class ModifierDyingWishDrawCard extends ModifierDyingWish {
  static initClass() {
    this.prototype.type = 'ModifierDyingWishDrawCard';
    this.type = 'ModifierDyingWishDrawCard';

    this.description = 'Draw %X';
  }

  static createContextObject(numCards) {
    if (numCards == null) { numCards = 1; }
    const contextObject = super.createContextObject();
    contextObject.numCards = numCards;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      if (modifierContextObject.numCards <= 1) {
        return this.description.replace(/%X/, 'a card');
      }
      return this.description.replace(/%X/, `${modifierContextObject.numCards} cards`);
    }
    return this.description;
  }

  onDyingWish(action) {
    super.onDyingWish();

    return (() => {
      const result = [];
      for (let i = 0, end = this.numCards, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
        const deck = this.getGameSession().getPlayerById(this.getCard().getOwnerId()).getDeck();
        result.push(this.getCard().getGameSession().executeAction(deck.actionDrawCard()));
      }
      return result;
    })();
  }
}
ModifierDyingWishDrawCard.initClass();

module.exports = ModifierDyingWishDrawCard;
