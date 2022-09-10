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
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Factions = require('app/sdk/cards/factionsLookup');
const Races = require('app/sdk/cards/racesLookup');
const PlayCardAction = require('app/sdk/actions/playCardAction');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const SpellSpawnEntity = 	require('./spellSpawnEntity');

class SpellEntanglingShadows extends SpellSpawnEntity {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const applyEffectPosition = { x, y };

    // always spawn a shadow tile at each position
    if (board.isOnBoard(applyEffectPosition)) {
      const action = new PlayCardAction(this.getGameSession(), this.getOwnerId(), x, y, { id: Cards.Tile.Shadow });
      action.setOwnerId(this.getOwnerId());
      this.getGameSession().executeAction(action);
    }

    // spawn random battle pet
    const spawnAction = this.getSpawnAction(x, y, this.cardDataOrIndexToSpawn);
    if (spawnAction != null) {
      return this.getGameSession().executeAction(spawnAction);
    }
  }
}

module.exports = SpellEntanglingShadows;
