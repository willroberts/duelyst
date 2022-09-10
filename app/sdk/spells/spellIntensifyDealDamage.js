/* eslint-disable
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const DamageAction = require('app/sdk/actions/damageAction');
const SpellIntensify = require('./spellIntensify');

class SpellIntensifyDealDamage extends SpellIntensify {
  static initClass() {
    this.prototype.damageAmount = 0;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const target = board.getCardAtPosition({ x, y }, CardType.Unit);

    const totalDamageAmount = this.damageAmount * this.getIntensifyAmount();

    const damageAction = new DamageAction(this.getGameSession());
    damageAction.setOwnerId(this.ownerId);
    damageAction.setTarget(target);
    damageAction.setDamageAmount(totalDamageAmount);
    return this.getGameSession().executeAction(damageAction);
  }
}
SpellIntensifyDealDamage.initClass();

module.exports = SpellIntensifyDealDamage;
