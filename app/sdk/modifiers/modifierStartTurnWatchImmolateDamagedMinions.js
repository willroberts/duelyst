/* eslint-disable
    import/no-unresolved,
    max-len,
    no-loop-func,
    no-restricted-syntax,
    no-var,
    vars-on-top,
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
const HealAction = require('app/sdk/actions/healAction');
const DamageAction = require('app/sdk/actions/damageAction');
const CardType = require('app/sdk/cards/cardType');
const ModifierStartTurnWatch = require('./modifierStartTurnWatch');

class ModifierStartTurnWatchImmolateDamagedMinions extends ModifierStartTurnWatch {
  static initClass() {
    this.prototype.type = 'ModifierStartTurnWatchImmolateDamagedMinions';
    this.type = 'ModifierStartTurnWatchImmolateDamagedMinions';

    this.prototype.fxResource = ['FX.Modifiers.ModifierStartTurnWatch', 'FX.Modifiers.ModifierGenericHeal', 'FX.Modifiers.ModifierGenericDamageNearby'];
  }

  onTurnWatch() {
    const board = this.getGameSession().getBoard();

    return (() => {
      const result = [];
      for (const unit of Array.from(board.getUnits())) {
        if (((unit != null ? unit.getOwnerId() : undefined) === this.getCard().getOwnerId()) && !unit.getIsGeneral() && (unit.getHP() < unit.getMaxHP())) {
          const healAction = new HealAction(this.getGameSession());
          healAction.setOwnerId(this.getCard().getOwnerId());
          healAction.setTarget(unit);
          healAction.setHealAmount(4);
          this.getGameSession().executeAction(healAction);

          var enemyEntities = board.getEnemyEntitiesAroundEntity(unit, CardType.Unit, 1);
          result.push((() => {
            const result1 = [];
            for (const entity of Array.from(enemyEntities)) {
              const damageAction = new DamageAction(this.getGameSession());
              damageAction.setOwnerId(this.getCard().getOwnerId());
              damageAction.setSource(this.getCard());
              damageAction.setTarget(entity);
              damageAction.setDamageAmount(4);
              result1.push(this.getGameSession().executeAction(damageAction));
            }
            return result1;
          })());
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}
ModifierStartTurnWatchImmolateDamagedMinions.initClass();

module.exports = ModifierStartTurnWatchImmolateDamagedMinions;
