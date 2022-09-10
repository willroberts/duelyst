/* eslint-disable
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('app/common/config');
const CardType = require('app/sdk/cards/cardType');
const DamageAction = require('app/sdk/actions/damageAction');
const _ = require('underscore');
const SpellFilterType =	require('./spellFilterType');
const Spell = require('./spell');

class SpellRainOfSpikes extends Spell {
  static initClass() {
    this.prototype.spellFilterType = SpellFilterType.NeutralIndirect;
  }

  onApplyOneEffectToBoard(board, x, y, sourceAction) {
    super.onApplyOneEffectToBoard(board, x, y, sourceAction);

    // draw cards
    for (let i = 1, end = this.cardsToDraw, asc = end >= 1; asc ? i <= end : i >= end; asc ? i++ : i--) {
      let player = this.getGameSession().getPlayerById(this.getOwnerId());
      const action1 = player.getDeck().actionDrawCard();
      this.getGameSession().executeAction(action1);

      player = this.getGameSession().getOpponentPlayerOfPlayerId(this.getOwnerId());
      const action2 = player.getDeck().actionDrawCard();
      this.getGameSession().executeAction(action2);
    }

    // deal damage
    const enemyGeneral = this.getGameSession().getGeneralForOpponentOfPlayerId(this.getOwnerId());
    const damageAction1 = new DamageAction(this.getGameSession());
    damageAction1.setOwnerId(this.getOwnerId());
    damageAction1.setTarget(enemyGeneral);
    damageAction1.setDamageAmount(this.damageAmount);
    this.getGameSession().executeAction(damageAction1);

    const myGeneral = this.getGameSession().getGeneralForPlayerId(this.getOwnerId());
    const damageAction2 = new DamageAction(this.getGameSession());
    damageAction2.setOwnerId(this.getOwnerId());
    damageAction2.setTarget(myGeneral);
    damageAction2.setDamageAmount(this.damageAmount);
    return this.getGameSession().executeAction(damageAction2);
  }
}
SpellRainOfSpikes.initClass();

module.exports = SpellRainOfSpikes;
