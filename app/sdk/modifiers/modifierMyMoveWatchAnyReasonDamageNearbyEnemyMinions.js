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
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const DamageAction = require('app/sdk/actions/damageAction');
const ModifierMyMoveWatchAnyReason = require('./modifierMyMoveWatchAnyReason');

class ModifierMyMoveWatchAnyReasonDamageNearbyEnemyMinions extends ModifierMyMoveWatchAnyReason {
  static initClass() {
    this.prototype.type = 'ModifierMyMoveWatchAnyReasonDamageNearbyEnemyMinions';
    this.type = 'ModifierMyMoveWatchAnyReasonDamageNearbyEnemyMinions';

    this.modifierName = 'Move Watch Any Reason Self Damage Nearby Enemy Minions';
    this.description = 'Move Watch Any Reason Self Damage Nearby Enemy Minions';

    this.prototype.fxResource = ['FX.Modifiers.ModifierMyMoveWatch'];

    this.prototype.damageAmount = 0;
  }

  static createContextObject(damageAmount, options) {
    const contextObject = super.createContextObject();
    contextObject.damageAmount = damageAmount;
    return contextObject;
  }

  onMyMoveWatchAnyReason(action) {
    const entities = this.getGameSession().getBoard().getEnemyEntitiesAroundEntity(this.getCard(), CardType.Unit, 1);
    return (() => {
      const result = [];
      for (const entity of Array.from(entities)) {
        if (entity != null) {
          const damageAction = new DamageAction(this.getGameSession());
          damageAction.setOwnerId(this.getCard().getOwnerId());
          damageAction.setSource(this.getCard());
          damageAction.setTarget(entity);
          damageAction.setDamageAmount(this.damageAmount);
          result.push(this.getGameSession().executeAction(damageAction));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}
ModifierMyMoveWatchAnyReasonDamageNearbyEnemyMinions.initClass();

module.exports = ModifierMyMoveWatchAnyReasonDamageNearbyEnemyMinions;
