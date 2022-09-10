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
const KillAction = require('app/sdk/actions/killAction');
const Spell = require('./spell');
const SpellFilterType = require('./spellFilterType');

class SpellFollowupKillTarget extends Spell {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.NeutralDirect;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const applyEffectPosition = { x, y };
    const target = board.getCardAtPosition(applyEffectPosition, this.targetType);

    const killAction = new KillAction(this.getGameSession());
    killAction.setOwnerId(this.ownerId);
    killAction.setTarget(target);
    return this.getGameSession().executeAction(killAction);
  }
}
SpellFollowupKillTarget.initClass();

module.exports = SpellFollowupKillTarget;
