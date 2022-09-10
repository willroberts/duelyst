/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PutCardInDeckAction = require('app/sdk/actions/putCardInDeckAction');
const ModifierDyingWish =	require('./modifierDyingWish');

class ModifierDyingWishAddCardToDeck extends ModifierDyingWish {
  static initClass() {
    this.prototype.type = 'ModifierDyingWishAddCardToDeck';
    this.type = 'ModifierDyingWishAddCardToDeck';

    this.prototype.cardData = null;
  }

  static createContextObject(cardData, options) {
    const contextObject = super.createContextObject(options);
    contextObject.cardData = cardData;
    return contextObject;
  }

  onDyingWish() {
    if (this.cardData != null) {
      this.cardData.ownerId = this.getOwnerId();
      const putCardInDeckAction = new PutCardInDeckAction(this.getGameSession(), this.getOwnerId(), this.cardData);
      return this.getGameSession().executeAction(putCardInDeckAction);
    }
  }
}
ModifierDyingWishAddCardToDeck.initClass();

module.exports = ModifierDyingWishAddCardToDeck;
