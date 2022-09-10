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
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const GameFormat = require('app/sdk/gameFormat');
const ModifierManaCostChange = require('./modifierManaCostChange');
const ModifierOpeningGambit = require('./modifierOpeningGambit');

class ModifierOpeningGambitGrincher extends ModifierOpeningGambit {
  static initClass() {
    this.prototype.type = 'ModifierOpeningGambitGrincher';
    this.type = 'ModifierOpeningGambitGrincher';

    this.description = 'Put a random artifact into your action bar. It costs 2 less';
  }

  onOpeningGambit() {
    super.onOpeningGambit();

    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      let artifactCards = [];
      if (this.getGameSession().getGameFormat() === GameFormat.Standard) {
        artifactCards = this.getGameSession().getCardCaches().getIsLegacy(false).getType(CardType.Artifact)
          .getIsHiddenInCollection(false)
          .getIsPrismatic(false)
          .getIsSkinned(false)
          .getCards();
      } else {
        artifactCards = this.getGameSession().getCardCaches().getType(CardType.Artifact).getIsHiddenInCollection(false)
          .getIsPrismatic(false)
          .getIsSkinned(false)
          .getCards();
      }
      if (artifactCards.length > 0) {
        const artifactCard = artifactCards[this.getGameSession().getRandomIntegerForExecution(artifactCards.length)]; // random artifact
        const cardDataOrIndexToPutInHand = artifactCard.createNewCardData();
        const costChangeContextObject = ModifierManaCostChange.createContextObject(-3);
        costChangeContextObject.appliedName = 'Grinched';
        cardDataOrIndexToPutInHand.additionalModifiersContextObjects = [costChangeContextObject];
        const a = new PutCardInHandAction(this.getGameSession(), this.getCard().getOwnerId(), cardDataOrIndexToPutInHand);
        return this.getGameSession().executeAction(a);
      }
    }
  }
}
ModifierOpeningGambitGrincher.initClass();

module.exports = ModifierOpeningGambitGrincher;
