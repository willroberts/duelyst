/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Achievement = require('app/sdk/achievements/achievement');
const CardSet = require('app/sdk/cards/cardSetLookup');
const i18next = require('i18next');

class MythronOrb7Achievement extends Achievement {
	static initClass() {
		this.id = "mythron7";
		this.title = "Seventh Trial";
		this.description = "You've opened 61 Mythron Orbs, here's a brand new Mythron card.";
		this.progressRequired = 61;
		this.rewards =
			{mythronCard: 1};
	}

	static progressForOpeningSpiritOrb(orbSet) {
		if (orbSet === CardSet.Coreshatter) {
			return 1;
		} else {
			return 0;
		}
	}
}
MythronOrb7Achievement.initClass();

module.exports = MythronOrb7Achievement;
