/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-restricted-syntax,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('app/common/config');
const CardType = require('app/sdk/cards/cardType');
const _ = require('underscore');
const RemoveCardFromDeckAction = require('app/sdk/actions/removeCardFromDeckAction');
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const SpellFilterType =	require('./spellFilterType');
const Spell = require('./spell');

class SpellFillHandFromOpponentsDeck extends Spell {
  static initClass() {
    this.prototype.spellFilterType = SpellFilterType.NeutralIndirect;
  }

  onApplyOneEffectToBoard(board, x, y, sourceAction) {
    super.onApplyOneEffectToBoard(board, x, y, sourceAction);

    // get number of empty slots in hand I need to Fill
    let emptySlots = 0;
    const myHand = this.getGameSession().getPlayerById(this.getOwnerId()).getDeck().getHand();
    for (const card of Array.from(myHand)) {
      if ((card === null) || (card === undefined)) {
        emptySlots++;
      }
    }

    if (emptySlots > 0) {
      let opponentCard; let
        opponentPlayer;
      const cardIndices = []; // first create indices of the cards we want to take from the opponent's deck
      for (let i = 1, end = emptySlots, asc = end >= 1; asc ? i <= end : i >= end; asc ? i++ : i--) {
        opponentPlayer = this.getGameSession().getOpponentPlayerOfPlayerId(this.getOwnerId());
        const opponentsDrawPile = opponentPlayer.getDeck().getDrawPile();
        if (opponentsDrawPile.length > 0) {
          const randomIndex = this.getGameSession().getRandomIntegerForExecution(opponentsDrawPile.length);
          opponentCard = this.getGameSession().getCardByIndex(opponentsDrawPile[randomIndex]);
          cardIndices.push(opponentCard);
          opponentsDrawPile.splice(randomIndex, 1);
        }
      }

      // then we can cycle through those indices without worrying about the same instance of a card being chosen multiple times
      if (cardIndices.length > 0) {
        return (() => {
          const result = [];
          for (const newCard of Array.from(cardIndices)) {
            if (opponentCard != null) {
              const myNewCardData = newCard.createCardData();
              myNewCardData.ownerId = this.getOwnerId(); // reset owner id to player who will recieve this card
              const removeCardFromDeckAction = new RemoveCardFromDeckAction(this.getGameSession(), newCard.getIndex(), opponentPlayer.getPlayerId());
              this.getGameSession().executeAction(removeCardFromDeckAction);
              const putCardInHandAction = new PutCardInHandAction(this.getGameSession(), this.getOwnerId(), myNewCardData);
              result.push(this.getGameSession().executeAction(putCardInHandAction));
            } else {
              result.push(undefined);
            }
          }
          return result;
        })();
      }
    }
  }
}
SpellFillHandFromOpponentsDeck.initClass();

module.exports = SpellFillHandFromOpponentsDeck;
