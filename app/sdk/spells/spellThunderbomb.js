/* eslint-disable
    import/no-unresolved,
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
const SpellDamage = require('./spellDamage');

class SpellThunderbomb extends SpellDamage {
  static initClass() {
    this.prototype.damageAmount = 3;
    this.prototype.aoeAmount = 1;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    const applyEffectPosition = { x, y };
    const targetEntity = board.getUnitAtPosition(applyEffectPosition);
    const enemyEntities = board.getFriendlyEntitiesAroundEntity(targetEntity, CardType.Unit, 1);

    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    // damage enemy units around target
    return (() => {
      const result = [];
      for (const entity of Array.from(enemyEntities)) {
        const damageAction = new DamageAction(this.getGameSession());
        damageAction.setOwnerId(this.getOwnerId());
        damageAction.setSource(this);
        damageAction.setTarget(entity);
        damageAction.setDamageAmount(this.aoeAmount);
        result.push(this.getGameSession().executeAction(damageAction));
      }
      return result;
    })();
  }
}
SpellThunderbomb.initClass();

module.exports = SpellThunderbomb;
