/* eslint-disable
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
const Cards = require('app/sdk/cards/cardsLookup.coffee');
const Races = require('app/sdk/cards/racesLookup.coffee');
const _ = require('underscore');
const SpellAspectBase = require('./spellAspectBase');

class SpellAlteredBeast extends SpellAspectBase {
  getCardDataOrIndexToSpawn(x, y) {
    // pick a random battle pet
    let allBattlePetCards = this.getGameSession().getCardCaches().getRace(Races.BattlePet).getIsPrismatic(false)
      .getIsSkinned(false)
      .getCards();
    allBattlePetCards = _.reject(allBattlePetCards, (card) => {
      const baseCardId = card.getBaseCardId();
      return baseCardId === Cards.Neutral.Rawr;
    });
    const card = allBattlePetCards[this.getGameSession().getRandomIntegerForExecution(allBattlePetCards.length)];
    this.cardDataOrIndexToSpawn = card.createNewCardData();

    return super.getCardDataOrIndexToSpawn(x, y);
  }
}

module.exports = SpellAlteredBeast;
