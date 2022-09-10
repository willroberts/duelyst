/* eslint-disable
    consistent-return,
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
const BonusManaCoreAction = require('app/sdk/actions/bonusManaCoreAction');
const ModifierOpeningGambit =	require('./modifierOpeningGambit');

class ModifierOpeningGambitBonusManaCrystal extends ModifierOpeningGambit {
  static initClass() {
    this.prototype.type = 'ModifierOpeningGambitBonusManaCrystal';
    this.type = 'ModifierOpeningGambitBonusManaCrystal';

    this.prototype.giveToOwner = true; // if false, will give mana to OPPONENT of entity
    this.prototype.amountToGive = 1;
  }

  static createContextObject(giveToOwner, amountToGive, options) {
    if (giveToOwner == null) { giveToOwner = true; }
    if (amountToGive == null) { amountToGive = 1; }
    const contextObject = super.createContextObject(options);
    contextObject.amountToGive = amountToGive;
    contextObject.giveToOwner = giveToOwner;
    return contextObject;
  }

  onOpeningGambit() {
    super.onOpeningGambit();
    if (this.amountToGive > 0) {
      return (() => {
        const result = [];
        for (let i = 0, end = this.amountToGive, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
          const bonusManaCoreAction = new BonusManaCoreAction(this.getGameSession());
          bonusManaCoreAction.setSource(this.getCard());
          if (this.giveToOwner) {
            bonusManaCoreAction.setOwnerId(this.getCard().getOwnerId());
          } else {
            bonusManaCoreAction.setOwnerId(this.getGameSession().getOpponentPlayerIdOfPlayerId(this.getCard().getOwnerId()));
          }
          result.push(this.getGameSession().executeAction(bonusManaCoreAction));
        }
        return result;
      })();
    }
  }
}
ModifierOpeningGambitBonusManaCrystal.initClass();

module.exports = ModifierOpeningGambitBonusManaCrystal;
