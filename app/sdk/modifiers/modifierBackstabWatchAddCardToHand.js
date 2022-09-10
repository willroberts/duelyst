/* eslint-disable
    import/no-unresolved,
    max-len,
    no-plusplus,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const ModifierBackstabWatch = require('./modifierBackstabWatch');

class ModifierBackstabWatchAddCardToHand extends ModifierBackstabWatch {
  static initClass() {
    this.prototype.type = 'ModifierBackstabWatchAddCardToHand';
    this.type = 'ModifierBackstabWatchAddCardToHand';

    this.prototype.cardToAdd = null;
    this.prototype.numToAdd = 0;
  }

  static createContextObject(cardToAdd, numToAdd, options) {
    const contextObject = super.createContextObject(options);
    contextObject.cardToAdd = cardToAdd;
    contextObject.numToAdd = numToAdd;
    return contextObject;
  }

  onBackstabWatch(action) {
    return (() => {
      const result = [];
      for (let i = 0, end = this.numToAdd, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
        const putCardInHandAction = new PutCardInHandAction(this.getGameSession(), this.getOwnerId(), this.cardToAdd);
        result.push(this.getGameSession().executeAction(putCardInHandAction));
      }
      return result;
    })();
  }
}
ModifierBackstabWatchAddCardToHand.initClass();

module.exports = ModifierBackstabWatchAddCardToHand;
