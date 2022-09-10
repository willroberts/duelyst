/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

const CardSet = require('./cardSetLookup');
const i18next = require('i18next');

class CardSetFactory {
	static initClass() {
	
		this.setMap = {};
	}

	static cardSetForIdentifier(identifier) {
		return CardSetFactory.setMap[identifier];
	}

	static cardSetForDevName(devName) {
		for (let cardSetId in CardSetFactory.setMap) {
			const cardSetData = CardSetFactory.setMap[cardSetId];
			if (cardSetData.devName === devName) {
				return cardSetData;
			}
		}

		return null;
	}
}
CardSetFactory.initClass();

// generate sets once in a map
const smap = CardSetFactory.setMap;

// core
smap[CardSet.Core] = {
	id: CardSet.Core,
	title: i18next.t("card_sets.core_set_name"),
	name: i18next.t("card_sets.core_set_name_short"),
	devName: "core",
	enabled: true,
	orbGoldCost: 100,
	cardSetUrl: "https://cards.duelyst.com/core-set"
};

// bloodborn
smap[CardSet.Bloodborn] = {
	id: CardSet.Bloodborn,
	title: i18next.t("card_sets.bloodborn_set_name"),
	name: i18next.t("card_sets.bloodborn_set_name_short"),
	devName: "bloodborn",
	enabled: false,
	orbGoldCost: 300,
	isUnlockableThroughOrbs: true,
	numOrbsToCompleteSet: 13,
	orbGoldRefund: 300, // If a player buys a complete set this is what they get back per orb already purchased
	fullSetSpiritCost: 15000,
	orbSpiritRefund: 300,
	cardSetUrl: "https://cards.duelyst.com/rise-of-the-bloodborn"
};

// unity
smap[CardSet.Unity] = {
	id: CardSet.Unity,
	title: i18next.t("card_sets.ancient_bonds_set_name"),
	name: i18next.t("card_sets.ancient_bonds_set_name_short"),
	devName: "unity",
	enabled: true,
	orbGoldCost: 300,
	isUnlockableThroughOrbs: true,
	numOrbsToCompleteSet: 13,
	fullSetSpiritCost: 15000,
	orbGoldRefund: 300, // If a player buys a complete set this is what they get back per orb already purchased
	cardSetUrl: "https://cards.duelyst.com/ancient-bonds"
};

// gauntlet specials
smap[CardSet.GauntletSpecial] = {
	id: CardSet.Unity,
	name: "Gauntlet Specials",
	devName: "gauntlet_special",
	title: "Gauntlet Specials",
	enabled: true
};

// first watch
smap[CardSet.FirstWatch] = {
	id: CardSet.FirstWatch,
	name: i18next.t("card_sets.firstwatch_set_name_short"),
	devName: "firstwatch",
	title: i18next.t("card_sets.firstwatch_set_name"),
	enabled: true,
	orbGoldCost: 100,
	cardSetUrl: "https://cards.duelyst.com/unearthed-prophecy"
};

// wartech
smap[CardSet.Wartech] = {
	id: CardSet.Wartech,
	name: "Immortal",
	devName: "wartech",
	title: "Immortal Vanguard",
	orbGoldCost: 100,
	enabled: true,
	isPreRelease: false, // allows users seeing orbs and receiving them, but disables purchasing for gold and opening them
	cardSetUrl: "https://cards.duelyst.com/immortal-vanguard"
};

// shimzar
smap[CardSet.Shimzar] = {
	id: CardSet.Shimzar,
	title: i18next.t("card_sets.shimzar_set_name"),
	name: i18next.t("card_sets.shimzar_set_name_short"),
	devName: "shimzar",
	enabled: true,
	orbGoldCost: 100,
	cardSetUrl: "https://cards.duelyst.com/denizens-of-shimzar"
};

smap[CardSet.CombinedUnlockables] = {
	id: CardSet.CombinedUnlockables,
	title: i18next.t("card_sets.combined_unlockables_set_name"),
	name: i18next.t("card_sets.combined_unlockables_set_name_short"),
	devName: "combined_unlockables",
	enabled: true,
	orbGoldCost: 100,
	cardSetUrl: "https://cards.duelyst.com/ancient-bonds"
};

// coreshatter
smap[CardSet.Coreshatter] = {
	id: CardSet.Coreshatter,
	name: "Mythron",
	devName: "coreshatter",
	title: "Trials of Mythron",
	orbGoldCost: 100,
	enabled: true,
	cardSetUrl: "https://cards.duelyst.com/trials-of-mythron"
};

module.exports = CardSetFactory;
