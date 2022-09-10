/* eslint-disable
    import/no-unresolved,
    max-len,
    no-mixed-spaces-and-tabs,
    no-param-reassign,
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
const BonusManaCoreAction = require('app/sdk/actions/bonusManaCoreAction');
const i18next = require('i18next');
const ModifierMyAttackWatch =	require('./modifierMyAttackWatch');

class ModifierMyAttackWatchBonusManaCrystal extends ModifierMyAttackWatch {
  static initClass() {
    this.prototype.type = 'ModifierMyAttackWatchBonusManaCrystal';
    this.type = 'ModifierMyAttackWatchBonusManaCrystal';

    this.description = i18next.t('modifiers.faction_6_shivers_buff_desc');

    this.prototype.giveToOwner = true;
		 // if false, will give mana to OPPONENT of attacking entity
  }

  static createContextObject(giveToOwner, options) {
    if (giveToOwner == null) { giveToOwner = true; }
    const contextObject = super.createContextObject(options);
    contextObject.giveToOwner = giveToOwner;
    return contextObject;
  }

  onMyAttackWatch(action) {
    const bonusManaCoreAction = new BonusManaCoreAction(this.getGameSession());
    bonusManaCoreAction.setSource(this.getCard());
    if (this.giveToOwner) {
      bonusManaCoreAction.setOwnerId(this.getCard().getOwnerId());
    } else {
      bonusManaCoreAction.setOwnerId(this.getGameSession().getOpponentPlayerIdOfPlayerId(this.getCard().getOwnerId()));
    }
    return this.getGameSession().executeAction(bonusManaCoreAction);
  }
}
ModifierMyAttackWatchBonusManaCrystal.initClass();

module.exports = ModifierMyAttackWatchBonusManaCrystal;
