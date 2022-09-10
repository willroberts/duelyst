/* eslint-disable
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Cards = require('app/sdk/cards/cardsLookup');
const SpellSpawnEntity = require('./spellSpawnEntity');

class SpellInklingSurge extends SpellSpawnEntity {
  onApplyToBoard(board, x, y, sourceAction) {
    for (const entity of Array.from(board.getEntities(true, false))) {
      if ((entity.getOwnerId() === this.getOwnerId()) && (entity.getBaseCardId() === Cards.Faction4.Wraithling)) {
        this.getGameSession().executeAction(this.getOwner().getDeck().actionDrawCard());
        break;
      }
    }

    return super.onApplyToBoard(board, x, y, sourceAction);
  }
}

module.exports = SpellInklingSurge;
