/* eslint-disable
    import/no-unresolved,
    max-len,
    no-plusplus,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const Factions = require('app/sdk/cards/factionsLookup');
const Races = require('app/sdk/cards/racesLookup');
const Spell = require('./spell');

class SpellAstralFlood extends Spell {
  onApplyOneEffectToBoard(board, x, y, sourceAction) {
    super.onApplyOneEffectToBoard(board, x, y, sourceAction);

    // pull faction battle pets + neutral token battle pets
    const factionBattlePetCards = this.getGameSession().getCardCaches().getFaction(Factions.Faction3).getRace(Races.BattlePet)
      .getIsToken(false)
      .getIsPrismatic(false)
      .getIsSkinned(false)
      .getCards();
    const neutralBattlePetCards = this.getGameSession().getCardCaches().getFaction(Factions.Neutral).getRace(Races.BattlePet)
      .getIsToken(true)
      .getIsPrismatic(false)
      .getIsSkinned(false)
      .getCards();
    const battlePetCards = [].concat(factionBattlePetCards, neutralBattlePetCards);

    return (() => {
      const result = [];
      for (let i = 0; i <= 2; i++) {
        const card = battlePetCards[this.getGameSession().getRandomIntegerForExecution(battlePetCards.length)];
        const a = new PutCardInHandAction(this.getGameSession(), this.getOwnerId(), card.createNewCardData());
        result.push(this.getGameSession().executeAction(a));
      }
      return result;
    })();
  }
}

module.exports = SpellAstralFlood;
