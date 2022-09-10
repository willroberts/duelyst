/* eslint-disable
    import/no-unresolved,
    no-param-reassign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const ModifierOverwatch = require('app/sdk/modifiers/modifierOverwatch');
const Spell = require('./spell');

/*
  Generic spell used to hide the true overwatch spell from an opponent.
*/
class SpellOverwatch extends Spell {
  static initClass() {
    this.prototype.name = 'Overwatch';
  }

  getPrivateDefaults(gameSession) {
    const p = super.getPrivateDefaults(gameSession);

    p.description = 'Give a minion Overwatch: A hidden effect that costs %X mana.';
    p.keywordClassesToInclude.push(ModifierOverwatch);

    return p;
  }

  getDescription(options) {
    let description = super.getDescription(options);

    description = description.replace(/%X/, this.manaCost);

    return description;
  }

  createCardData(cardData) {
    cardData = super.createCardData(cardData);

    cardData.manaCost = this.getBaseManaCost();

    return cardData;
  }

  onCreatedToHide(source) {
    super.onCreatedToHide(source);

    // copy mana cost
    return this.setBaseManaCost(source.getBaseManaCost());
  }
}
SpellOverwatch.initClass();

module.exports = SpellOverwatch;
