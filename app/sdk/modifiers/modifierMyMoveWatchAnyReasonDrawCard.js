/* eslint-disable
    import/no-unresolved,
    max-len,
    no-param-reassign,
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
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const ModifierMyMoveWatchAnyReason = require('./modifierMyMoveWatchAnyReason');

class ModifierMyMoveWatchAnyReasonDrawCard extends ModifierMyMoveWatchAnyReason {
  static initClass() {
    this.prototype.type = 'ModifierMyMoveWatchAnyReasonDrawCard';
    this.type = 'ModifierMyMoveWatchAnyReasonDrawCard';

    this.prototype.fxResource = ['FX.Modifiers.ModifierMyMoveWatch'];

    this.prototype.drawAmount = 1;
  }

  static createContextObject(drawAmount, options) {
    if (drawAmount == null) { drawAmount = 1; }
    const contextObject = super.createContextObject();
    contextObject.drawAmount = drawAmount;
    return contextObject;
  }

  onMyMoveWatchAnyReason(action) {
    return (() => {
      const result = [];
      for (let i = 0, end = this.drawAmount, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
        const deck = this.getGameSession().getPlayerById(this.getCard().getOwnerId()).getDeck();
        result.push(this.getCard().getGameSession().executeAction(deck.actionDrawCard()));
      }
      return result;
    })();
  }
}
ModifierMyMoveWatchAnyReasonDrawCard.initClass();

module.exports = ModifierMyMoveWatchAnyReasonDrawCard;
