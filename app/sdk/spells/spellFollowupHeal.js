/* eslint-disable
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
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Logger = require('app/common/logger');
const CardType = require('app/sdk/cards/cardType');
const HealAction = require('app/sdk/actions/healAction');
const Spell = 	require('./spell');
const SpellFilterType = require('./spellFilterType');

class SpellFollowupHeal extends Spell {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.NeutralDirect;
    this.prototype.healAmount = 0;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const applyEffectPosition = { x, y };
    const target = board.getCardAtPosition(applyEffectPosition, this.targetType);
    // Logger.module("SDK").debug "[G:#{@.getGameSession().gameId}]", "SpellFollowupHeal::onApplyEffectToBoardTile -> #{@healAmount} heal to #{target.getName()} at #{x}, #{y}"

    const healAction = new HealAction(this.getGameSession());
    healAction.setOwnerId(this.ownerId);
    healAction.setTarget(target);
    healAction.setHealAmount(this.healAmount);
    return this.getGameSession().executeAction(healAction);
  }
}
SpellFollowupHeal.initClass();

module.exports = SpellFollowupHeal;
