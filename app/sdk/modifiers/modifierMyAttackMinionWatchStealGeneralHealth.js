/* eslint-disable
    import/no-unresolved,
    max-len,
    no-param-reassign,
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
const HealAction = require('app/sdk/actions/healAction');
const DamageAction = require('app/sdk/actions/damageAction');
const ModifierMyAttackMinionWatch = require('./modifierMyAttackMinionWatch');

class ModifierMyAttackMinionWatchStealGeneralHealth extends ModifierMyAttackMinionWatch {
  static initClass() {
    this.prototype.type = 'ModifierMyAttackMinionWatchStealGeneralHealth';
    this.type = 'ModifierMyAttackMinionWatchStealGeneralHealth';

    this.prototype.stealAmount = 0;
  }

  static createContextObject(stealAmount, options) {
    if (stealAmount == null) { stealAmount = 0; }
    const contextObject = super.createContextObject(options);
    contextObject.stealAmount = stealAmount;
    return contextObject;
  }

  onMyAttackMinionWatch(action) {
    const general = this.getCard().getGameSession().getGeneralForPlayerId(this.getCard().getOwnerId());

    const healAction = new HealAction(this.getGameSession());
    healAction.setOwnerId(this.getOwnerId());
    healAction.setTarget(general);
    healAction.setHealAmount(this.stealAmount);
    this.getGameSession().executeAction(healAction);

    const enemyGeneral = this.getCard().getGameSession().getGeneralForPlayerId(this.getGameSession().getOpponentPlayerIdOfPlayerId(this.getCard().getOwnerId()));

    const damageAction = new DamageAction(this.getGameSession());
    damageAction.setOwnerId(this.getOwnerId());
    damageAction.setTarget(enemyGeneral);
    damageAction.setDamageAmount(this.stealAmount);
    return this.getGameSession().executeAction(damageAction);
  }
}
ModifierMyAttackMinionWatchStealGeneralHealth.initClass();

module.exports = ModifierMyAttackMinionWatchStealGeneralHealth;
