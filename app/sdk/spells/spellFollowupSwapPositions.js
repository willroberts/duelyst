/* eslint-disable
    import/no-unresolved,
    max-len,
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
const SwapUnitsAction = require('app/sdk/actions/swapUnitsAction');
const FXType = require('app/sdk/helpers/fxType');
const _ = require('underscore');
const SpellFilterType = require('./spellFilterType');
const Spell = require('./spell');

class SpellFollowupSwapPositions extends Spell {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.None;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    // Logger.module("SDK").debug "[G:#{@.getGameSession().gameId}]", "SpellFollowupSwapPositions::onApplyEffectToBoardTile "
    const applyEffectPosition = { x, y };

    const source = board.getCardAtPosition(this.getFollowupSourcePosition(), this.targetType);
    const target = board.getCardAtPosition(applyEffectPosition, this.targetType);

    const swapAction = new SwapUnitsAction(this.getGameSession());
    swapAction.setOwnerId(this.getOwnerId());
    swapAction.setSource(source);
    swapAction.setTarget(target);
    swapAction.setFXResource(_.union(swapAction.getFXResource(), this.getFXResource()));
    return this.getGameSession().executeAction(swapAction);
  }
}
SpellFollowupSwapPositions.initClass();

module.exports = SpellFollowupSwapPositions;
