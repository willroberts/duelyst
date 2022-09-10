/* eslint-disable
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
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const DamageAction = require('app/sdk/actions/damageAction');
const CONFIG = require('app/common/config');
const CardType = require('app/sdk/cards/cardType');
const ModifierTakeDamageWatch = require('./modifierTakeDamageWatch');

class ModifierTakeDamageWatchDamageAllEnemies extends ModifierTakeDamageWatch {
  static initClass() {
    this.prototype.type = 'ModifierTakeDamageWatchDamageAllEnemies';
    this.type = 'ModifierTakeDamageWatchDamageAllEnemies';

    this.modifierName = 'Take Damage Watch';
    this.description = 'Whenever this minion takes damage, deal %X damage to all enemies';

    this.prototype.fxResource = ['FX.Modifiers.ModifierTakeDamageWatch', 'FX.Modifiers.ModifierGenericDamage'];
  }

  static createContextObject(damageAmount, options) {
    const contextObject = super.createContextObject(options);
    contextObject.damageAmount = damageAmount;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return this.description.replace(/%X/, modifierContextObject.damageAmount);
    }
    return this.description;
  }

  onDamageTaken(action) {
    return (() => {
      const result = [];
      for (const enemyMinion of Array.from(this.getGameSession().getBoard().getEnemyEntitiesForEntity(this.getCard(), CardType.Unit))) {
        const damageAction = new DamageAction(this.getGameSession());
        damageAction.setOwnerId(this.getCard().getOwnerId());
        damageAction.setSource(this.getCard());
        damageAction.setTarget(enemyMinion);
        damageAction.setDamageAmount(this.damageAmount);
        result.push(this.getGameSession().executeAction(damageAction));
      }
      return result;
    })();
  }
}
ModifierTakeDamageWatchDamageAllEnemies.initClass();

module.exports = ModifierTakeDamageWatchDamageAllEnemies;
