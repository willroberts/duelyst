/* eslint-disable
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Cards = require('app/sdk/cards/cardsLookupComplete');
const RemoveAction = require('app/sdk/actions/removeAction');
const PlayCardAsTransformAction = require('app/sdk/actions/playCardAsTransformAction');
const ModifierTransformed = require('app/sdk/modifiers/modifierTransformed');
const RemoveCardFromHandAction = require('app/sdk/actions/removeCardFromHandAction');
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const RemoveCardFromDeckAction = require('app/sdk/actions/removeCardFromDeckAction');
const PutCardInDeckAction = require('app/sdk/actions/putCardInDeckAction');
const ModifierKillWatchAndSurvive = require('./modifierKillWatchAndSurvive');

class ModifierKillWatchAndSurviveScarzig extends ModifierKillWatchAndSurvive {
  static initClass() {
    this.prototype.type = 'ModifierKillWatchAndSurviveScarzig';
    this.type = 'ModifierKillWatchAndSurviveScarzig';

    this.prototype.fxResource = ['FX.Modifiers.ModifierKillWatch'];
  }

  static createContextObject(options) {
    const contextObject = super.createContextObject(false, true, options);
    return contextObject;
  }

  onKillWatchAndSurvive(action) {
    super.onKillWatchAndSurvive(action);

    const deck = this.getCard().getOwner().getDeck();
    const iterable = deck.getCardsInHand();
    for (let i = 0; i < iterable.length; i++) {
      const cardInHand = iterable[i];
      if ((cardInHand != null) && (cardInHand.getBaseCardId() === Cards.Neutral.Scarzig)) {
        const removeCardFromHandAction = new RemoveCardFromHandAction(this.getGameSession(), i, this.getOwnerId());
        this.getGameSession().executeAction(removeCardFromHandAction);

        const putCardInHandAction = new PutCardInHandAction(this.getGameSession(), this.getOwnerId(), { id: Cards.Neutral.BigScarzig });
        this.getGameSession().executeAction(putCardInHandAction);
      }
    }

    for (const cardInDeck of Array.from(deck.getCardsInDrawPile())) {
      if ((cardInDeck != null) && (cardInDeck.getBaseCardId() === Cards.Neutral.Scarzig)) {
        const removeCardFromDeckAction = new RemoveCardFromDeckAction(this.getGameSession(), cardInDeck.getIndex(), this.getOwnerId());
        this.getGameSession().executeAction(removeCardFromDeckAction);

        const putCardInDeckAction = new PutCardInDeckAction(this.getGameSession(), this.getOwnerId(), { id: Cards.Neutral.BigScarzig });
        this.getGameSession().executeAction(putCardInDeckAction);
      }
    }

    return (() => {
      const result = [];
      for (const unit of Array.from(this.getGameSession().getBoard().getUnits())) {
        if ((unit != null) && unit.getIsSameTeamAs(this.getCard()) && !unit.getIsGeneral() && this.getGameSession().getCanCardBeScheduledForRemoval(unit) && (unit.getBaseCardId() === Cards.Neutral.Scarzig)) {
          const removeOriginalEntityAction = new RemoveAction(this.getGameSession());
          removeOriginalEntityAction.setOwnerId(this.getCard().getOwnerId());
          removeOriginalEntityAction.setTarget(unit);
          this.getGameSession().executeAction(removeOriginalEntityAction);

          const cardData = { id: Cards.Neutral.BigScarzig };
          if (cardData.additionalInherentModifiersContextObjects == null) { cardData.additionalInherentModifiersContextObjects = []; }
          cardData.additionalInherentModifiersContextObjects.push(ModifierTransformed.createContextObject(unit.getExhausted(), unit.getMovesMade(), unit.getAttacksMade()));
          const spawnEntityAction = new PlayCardAsTransformAction(this.getCard().getGameSession(), this.getCard().getOwnerId(), unit.getPosition().x, unit.getPosition().y, cardData);
          result.push(this.getGameSession().executeAction(spawnEntityAction));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}
ModifierKillWatchAndSurviveScarzig.initClass();

module.exports = ModifierKillWatchAndSurviveScarzig;
