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
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const Factions = require('app/sdk/cards/factionsLookup');
const Races = require('app/sdk/cards/racesLookup');
const ModifierDyingWish = require('./modifierDyingWish');

class ModifierDyingWishDrawRandomBattlePet extends ModifierDyingWish {
  static initClass() {
    this.prototype.type = 'ModifierDyingWishDrawRandomBattlePet';
    this.type = 'ModifierDyingWishDrawRandomBattlePet';

    this.modifierName = 'Dying Wish';
    this.description = 'Put a random Battle Pet into your action bar';

    this.prototype.fxResource = ['FX.Modifiers.ModifierDyingWish'];
  }

  onDyingWish() {
    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      const neutralBattlePetCards = this.getGameSession().getCardCaches().getFaction(Factions.Neutral).getRace(Races.BattlePet)
        .getIsToken(true)
        .getIsPrismatic(false)
        .getIsSkinned(false)
        .getCards();
      const card = neutralBattlePetCards[this.getGameSession().getRandomIntegerForExecution(neutralBattlePetCards.length)];
      const a = new PutCardInHandAction(this.getGameSession(), this.getCard().getOwnerId(), card.createNewCardData());
      return this.getGameSession().executeAction(a);
    }
  }
}
ModifierDyingWishDrawRandomBattlePet.initClass();

module.exports = ModifierDyingWishDrawRandomBattlePet;
