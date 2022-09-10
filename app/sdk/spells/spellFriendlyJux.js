/* eslint-disable
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const SwapUnitsAction = require('app/sdk/actions/swapUnitsAction');
const _ = require('underscore');
const Spell = require('./spell');

class SpellFriendlyJux extends Spell {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const applyEffectPosition = { x, y };
    const general = this.getGameSession().getGeneralForPlayerId(this.getOwnerId());
    const target = board.getUnitAtPosition(applyEffectPosition);

    const swapAction = new SwapUnitsAction(this.getGameSession());
    swapAction.setOwnerId(this.getOwnerId());
    swapAction.setSource(general);
    swapAction.setTarget(target);
    swapAction.setFXResource(_.union(swapAction.getFXResource(), this.getFXResource()));
    return this.getGameSession().executeAction(swapAction);
  }
}

module.exports = SpellFriendlyJux;
