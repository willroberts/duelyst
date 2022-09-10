/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Logger = require('app/common/logger');
const CardType = require('app/sdk/cards/cardType');
const KillAction = require('app/sdk/actions/killAction');
const Spell = 	require('./spell');
const SpellFilterType = require('./spellFilterType');

class SpellKillTarget extends Spell {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.NeutralDirect;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const target = board.getCardAtPosition({ x, y }, this.targetType);
    if (target != null) {
      // Logger.module("SDK").debug "[G:#{@.getGameSession().gameId}]", "SpellKillTarget::onApplyEffectToBoardTile -> kill #{target.getName()} at #{x}, #{y}"

      const killAction = new KillAction(this.getGameSession());
      killAction.setOwnerId(this.getOwnerId());
      killAction.setTarget(target);
      return this.getGameSession().executeAction(killAction);
    }
  }
}
SpellKillTarget.initClass();

module.exports = SpellKillTarget;
