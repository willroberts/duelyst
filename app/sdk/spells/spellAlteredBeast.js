const SpellAspectBase = require('./spellAspectBase');
const Cards = require('app/sdk/cards/cardsLookup.coffee');
const Races = require('app/sdk/cards/racesLookup.coffee');
const _ = require('underscore');

class SpellAlteredBeast extends SpellAspectBase {
	getCardDataOrIndexToSpawn(x, y) {
		// pick a random battle pet
		let allBattlePetCards = this.getGameSession().getCardCaches().getRace(Races.BattlePet).getIsPrismatic(false).getIsSkinned(false).getCards();
		allBattlePetCards = _.reject(allBattlePetCards, function(card) {
			const baseCardId = card.getBaseCardId();
			return baseCardId === Cards.Neutral.Rawr;
		});
		const card = allBattlePetCards[this.getGameSession().getRandomIntegerForExecution(allBattlePetCards.length)];
		this.cardDataOrIndexToSpawn = card.createNewCardData();

		return super.getCardDataOrIndexToSpawn(x, y);
	}
}

module.exports = SpellAlteredBeast;
