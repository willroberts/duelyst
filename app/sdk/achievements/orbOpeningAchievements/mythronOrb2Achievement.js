/* eslint-disable
    import/no-unresolved,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Achievement = require('app/sdk/achievements/achievement');
const CardSet = require('app/sdk/cards/cardSetLookup');
const i18next = require('i18next');

class MythronOrb2Achievement extends Achievement {
  static initClass() {
    this.id = 'mythron2';
    this.title = 'Second Trial';
    this.description = 'You\'ve opened 11 Mythron Orbs, here\'s a brand new Mythron card. You\'ll get another after opening 10 more orbs.';
    this.progressRequired = 11;
    this.rewards =			{ mythronCard: 1 };
  }

  static progressForOpeningSpiritOrb(orbSet) {
    if (orbSet === CardSet.Coreshatter) {
      return 1;
    }
    return 0;
  }
}
MythronOrb2Achievement.initClass();

module.exports = MythronOrb2Achievement;
