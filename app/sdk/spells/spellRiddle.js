/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const Spell = require('./spell');

class SpellRiddle extends Spell {
  getPrivateDefaults(gameSession) {
    const p = super.getPrivateDefaults(gameSession);

    p.canConvertCardToPrismatic = false; // retain prismatic state of the riddle spell

    return p;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      // put a Riddle in opponent's hand
      const putCardInHandAction = new PutCardInHandAction(this.getGameSession(), this.getGameSession().getOpponentPlayerIdOfPlayerId(this.getOwnerId()), { id: Cards.Spell.Riddle });
      return this.getGameSession().executeAction(putCardInHandAction);
    }
  }
}

module.exports = SpellRiddle;
