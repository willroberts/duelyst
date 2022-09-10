/* eslint-disable
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('app/common/config');
const CardType = require('app/sdk/cards/cardType');
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const Factions = require('app/sdk/cards/factionsLookup');
const SpellFilterType = require('./spellFilterType');
const Spell = 	require('./spell');

class SpellScionsSecondWish extends Spell {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.EnemyDirect;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    let cardIndex; let
      i;
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    // draw 2 Vetruvian cards
    const deck = this.getOwner().getDeck();
    const drawPile = deck.getDrawPile();
    const indexOfCards = [];
    for (i = 0; i < drawPile.length; i++) {
      cardIndex = drawPile[i];
      const card = this.getGameSession().getCardByIndex(cardIndex);
      if ((card != null) && (card.getFactionId() === Factions.Faction3)) {
        indexOfCards.push(i);
      }
    }

    return (() => {
      const result = [];
      for (i = 0; i < 2; i++) {
        if (indexOfCards.length > 0) {
          const whichCard = this.getGameSession().getRandomIntegerForExecution(indexOfCards.length);
          const indexOfCardInDeck = indexOfCards[whichCard];
          cardIndex = drawPile[indexOfCardInDeck];
          indexOfCards.splice(whichCard, 1); // remove this card from the list (don't try to draw same card twice)
          // put card in hand
          const putCardInHandAction = new PutCardInHandAction(this.getGameSession(), this.getOwnerId(), cardIndex);
          result.push(this.getGameSession().executeAction(putCardInHandAction));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}
SpellScionsSecondWish.initClass();

module.exports = SpellScionsSecondWish;
