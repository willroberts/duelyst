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
const CONFIG = require('app/common/config');
const KillAction = require('app/sdk/actions/killAction');
const CardType = require('app/sdk/cards/cardType');
const ModifierOpeningGambit = require('./modifierOpeningGambit');

class ModifierOpeningGambitDestroyEnemyMinions extends ModifierOpeningGambit {
  static initClass() {
    this.prototype.type = 'ModifierOpeningGambitDestroyEnemyMinions';
    this.type = 'ModifierOpeningGambitDestroyEnemyMinions';

    this.prototype.fxResource = ['FX.Modifiers.ModifierOpeningGambit'];
  }

  onOpeningGambit() {
    const entities = this.getGameSession().getBoard().getEnemyEntitiesAroundEntity(this.getCard(), CardType.Unit, CONFIG.WHOLE_BOARD_RADIUS);

    return (() => {
      const result = [];
      for (const entity of Array.from(entities)) {
        if (!entity.getIsGeneral()) { // this ability only kills minions, not Generals
          const killAction = new KillAction(this.getGameSession());
          killAction.setOwnerId(this.getCard().getOwnerId());
          killAction.setSource(this.getCard());
          killAction.setTarget(entity);
          result.push(this.getGameSession().executeAction(killAction));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}
ModifierOpeningGambitDestroyEnemyMinions.initClass();

module.exports = ModifierOpeningGambitDestroyEnemyMinions;
