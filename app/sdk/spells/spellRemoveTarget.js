/* eslint-disable
    consistent-return,
    import/no-unresolved,
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
const RemoveAction = require('app/sdk/actions/removeAction');
const Spell = 	require('./spell');
const SpellFilterType = require('./spellFilterType');

class SpellRemoveTarget extends Spell {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.NeutralDirect;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const target = board.getCardAtPosition({ x, y }, this.targetType);
    if (target != null) {
      const removeAction = new RemoveAction(this.getGameSession());
      removeAction.setOwnerId(this.getOwnerId());
      removeAction.setTarget(target);
      return this.getGameSession().executeAction(removeAction);
    }
  }
}
SpellRemoveTarget.initClass();

module.exports = SpellRemoveTarget;
