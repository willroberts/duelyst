/* eslint-disable
    consistent-return,
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
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const KillAction = require('app/sdk/actions/killAction');
const ModifierDyingWish = require('./modifierDyingWish');

class ModifierDyingWishDestroyRandomEnemyNearby extends ModifierDyingWish {
  static initClass() {
    this.prototype.type = 'ModifierDyingWishDestroyRandomEnemyNearby';
    this.type = 'ModifierDyingWishDestroyRandomEnemyNearby';
  }

  onDyingWish() {
    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      const entities = this.getGameSession().getBoard().getEnemyEntitiesAroundEntity(this.getCard(), CardType.Unit, 1);
      const validEntities = [];
      for (const entity of Array.from(entities)) {
        if (!entity.getIsGeneral()) {
          validEntities.push(entity);
        }
      }

      if (validEntities.length > 0) {
        const unitToDestroy = validEntities[this.getGameSession().getRandomIntegerForExecution(validEntities.length)];
        const killAction = new KillAction(this.getGameSession());
        killAction.setOwnerId(this.getOwnerId());
        killAction.setTarget(unitToDestroy);
        return this.getGameSession().executeAction(killAction);
      }
    }
  }
}
ModifierDyingWishDestroyRandomEnemyNearby.initClass();

module.exports = ModifierDyingWishDestroyRandomEnemyNearby;
