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
const IntentType = 					require('app/sdk/intentType');
const CardType = require('app/sdk/cards/cardType');
const SwapUnitAllegianceAction = 		require('app/sdk/actions/swapUnitAllegianceAction');
const SpellFilterType = require('./spellFilterType');
const Spell = 						require('./spell');

class SpellEnslave extends Spell {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.EnemyDirect;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    // Logger.module("SDK").debug "[G:#{@.getGameSession().gameId}]", "SpellEnslave::onApplyEffectToBoardTile"

    const applyEffectPosition = { x, y };
    const entity = board.getCardAtPosition(applyEffectPosition, this.targetType);
    const a = new SwapUnitAllegianceAction(this.getGameSession());
    a.setTarget(entity);
    return this.getGameSession().executeAction(a);
  }
}
SpellEnslave.initClass();

module.exports = SpellEnslave;
