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
const CardType = require('app/sdk/cards/cardType');
const ModifierIntensify = require('./modifierIntensify');

class ModifierIntensifyDamageNearby extends ModifierIntensify {
  static initClass() {
    this.prototype.type = 'ModifierIntensifyDamageNearby';
    this.type = 'ModifierIntensifyDamageNearby';

    this.prototype.fxResource = ['FX.Modifiers.ModifierGenericDamageNearby'];

    this.prototype.damageAmount = 0;
  }

  static createContextObject(damageAmount, options) {
    const contextObject = super.createContextObject(options);
    contextObject.damageAmount = damageAmount;
    return contextObject;
  }

  onIntensify() {
    const totalDamageAmount = this.getIntensifyAmount() * this.damageAmount;

    const entities = this.getGameSession().getBoard().getEntitiesAroundEntity(this.getCard(), CardType.Unit, 1);
    return (() => {
      const result = [];
      for (const entity of Array.from(entities)) {
        const damageAction = new DamageAction(this.getGameSession());
        damageAction.setOwnerId(this.getCard().getOwnerId());
        damageAction.setSource(this.getCard());
        damageAction.setTarget(entity);
        damageAction.setDamageAmount(totalDamageAmount);
        result.push(this.getGameSession().executeAction(damageAction));
      }
      return result;
    })();
  }
}
ModifierIntensifyDamageNearby.initClass();

module.exports = ModifierIntensifyDamageNearby;
