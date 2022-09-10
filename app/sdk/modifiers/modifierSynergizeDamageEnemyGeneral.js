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
const DamageAction = require('app/sdk/actions/damageAction');
const ModifierSynergize = require('./modifierSynergize');

class ModifierSynergizeDamageEnemyGeneral extends ModifierSynergize {
  static initClass() {
    this.prototype.type = 'ModifierSynergizeDamageEnemyGeneral';
    this.type = 'ModifierSynergizeDamageEnemyGeneral';

    this.description = 'Deal %X damage to the enemy General';

    this.prototype.damageAmount = 0;

    this.prototype.fxResource = ['FX.Modifiers.ModifierSpellWatch', 'FX.Modifiers.ModifierGenericDamage'];
  }

  static createContextObject(damageAmount, options) {
    const contextObject = super.createContextObject();
    contextObject.damageAmount = damageAmount;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return this.description.replace(/%X/, modifierContextObject.damageAmount);
    }
    return this.description;
  }

  onSynergize(action) {
    super.onSynergize(action);

    const damageAction = new DamageAction(this.getCard().getGameSession());
    damageAction.setOwnerId(this.getCard().getOwnerId());
    damageAction.setTarget(this.getGameSession().getGeneralForOpponentOfPlayerId(this.getCard().getOwnerId()));
    damageAction.setDamageAmount(this.damageAmount);
    return this.getGameSession().executeAction(damageAction);
  }
}
ModifierSynergizeDamageEnemyGeneral.initClass();

module.exports = ModifierSynergizeDamageEnemyGeneral;
