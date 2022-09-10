/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const KillAction = require('app/sdk/actions/killAction');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const SpellRemoveAndReplaceEntity = require('./spellRemoveAndReplaceEntity');

class SpellHugToDeath extends SpellRemoveAndReplaceEntity {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    const targetEntity = board.getUnitAtPosition({ x, y });
    if (targetEntity != null) {
      if (targetEntity.getBaseCardId() === Cards.Faction2.OnyxBear) {
        const killAction = new KillAction(this.getGameSession());
        killAction.setOwnerId(this.getOwnerId());
        killAction.setTarget(targetEntity);
        this.getGameSession().executeAction(killAction);

        const player = this.getGameSession().getPlayerById(this.getOwnerId());
        return Array.from(player.getDeck().actionsDrawCardsToRefillHand()).map((action) => this.getGameSession().executeAction(action));
      }
      this.cardDataOrIndexToSpawn = { id: Cards.Faction2.OnyxBear };
      return super.onApplyEffectToBoardTile(board, x, y, sourceAction);
    }
  }
}

module.exports = SpellHugToDeath;
