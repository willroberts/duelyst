/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-param-reassign,
    no-plusplus,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const RemoveCardFromHandAction = require('app/sdk/actions/removeCardFromHandAction');
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const ModifierManaCostChange = require('app/sdk/modifiers/modifierManaCostChange');
const Factions = require('app/sdk/cards/factionsLookup');
const GameFormat = require('app/sdk/gameFormat');
const ModifierCannotBeRemovedFromHand = require('app/sdk/modifiers/modifierCannotBeRemovedFromHand');
const _ = require('underscore');
const Spell = require('./spell');

class SpellGodMulligan extends Spell {
  onApplyOneEffectToBoard(board, x, y, sourceAction) {
    super.onApplyOneEffectToBoard(board, x, y, sourceAction);

    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      let factionCards;
      let numUnremovableCards = 0;
      const iterable = this.getOwner().getDeck().getCardsInHand();
      for (let i = 0; i < iterable.length; i++) {
        const card = iterable[i];
        if (card != null) {
          if (!card.hasActiveModifierClass(ModifierCannotBeRemovedFromHand)) {
            const removeCardFromHandAction = new RemoveCardFromHandAction(this.getGameSession(), i, this.getOwnerId());
            this.getGameSession().executeAction(removeCardFromHandAction);
          } else {
            numUnremovableCards++;
          }
        }
      }

      if (this.getGameSession().getGameFormat() === GameFormat.Standard) {
        factionCards = this.getGameSession().getCardCaches().getIsLegacy(false).getFaction(Factions.Vetruvian)
          .getIsHiddenInCollection(false)
          .getIsToken(false)
          .getIsGeneral(false)
          .getIsPrismatic(false)
          .getIsSkinned(false)
          .getCards();
      } else {
        factionCards = this.getGameSession().getCardCaches().getFaction(Factions.Vetruvian).getIsHiddenInCollection(false)
          .getIsToken(false)
          .getIsGeneral(false)
          .getIsPrismatic(false)
          .getIsSkinned(false)
          .getCards();
      }

      if ((factionCards != null ? factionCards.length : undefined) > 0) {
        // filter mythron cards
        factionCards = _.reject(factionCards, (card) => card.getRarityId() === 6);
      }

      if (factionCards.length > 0) {
        const numCardsToAdd = 5 - numUnremovableCards;
        return (() => {
          let asc; let
            end;
          const result = [];
          for (x = 0, end = numCardsToAdd, asc = end >= 0; asc ? x <= end : x >= end; asc ? x++ : x--) {
            const cardToPutInHand = factionCards[this.getGameSession().getRandomIntegerForExecution(factionCards.length)].createNewCardData();
            const manaModifierContextObject = ModifierManaCostChange.createContextObject(-4);
            if (cardToPutInHand.additionalModifiersContextObjects == null) { cardToPutInHand.additionalModifiersContextObjects = []; }
            cardToPutInHand.additionalModifiersContextObjects.push(manaModifierContextObject);

            const putCardInHandAction = new PutCardInHandAction(this.getGameSession(), this.getOwnerId(), cardToPutInHand);
            result.push(this.getGameSession().executeAction(putCardInHandAction));
          }
          return result;
        })();
      }
    }
  }
}

module.exports = SpellGodMulligan;
