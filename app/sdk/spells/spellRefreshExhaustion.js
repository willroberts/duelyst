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
const RefreshExhaustionAction =	require('app/sdk/actions/refreshExhaustionAction');
const Spell = require('./spell');
const SpellFilterType = require('./spellFilterType');

class SpellRefreshExhaustion extends Spell {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.AllyDirect;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const applyEffectPosition = { x, y };
    const target = board.getCardAtPosition(applyEffectPosition, this.targetType);

    // Logger.module("SDK").debug "[G:#{@.getGameSession().gameId}]", "SpellRefreshExhaustion::onApplyEffectToBoardTile"
    const refreshExhaustionAction = new RefreshExhaustionAction(this.getGameSession());
    refreshExhaustionAction.setTarget(target);
    return this.getGameSession().executeAction(refreshExhaustionAction);
  }
}
SpellRefreshExhaustion.initClass();

module.exports = SpellRefreshExhaustion;
