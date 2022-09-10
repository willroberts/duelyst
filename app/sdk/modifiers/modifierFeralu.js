/* eslint-disable
    import/no-unresolved,
    max-len,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('app/common/config');
const Races = require('app/sdk/cards/racesLookup');
const ModifierBelongsToAllRaces = require('app/sdk/modifiers/modifierBelongsToAllRaces');
const Modifier = require('./modifier');

class ModifierFeralu extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierFeralu';
    this.type = 'ModifierFeralu';

    this.modifierName = 'Feralu';
    this.description = '';
  }

  _filterPotentialCardInAura(card) {
    return ((card.getRaceId() !== Races.Neutral) || card.hasModifierClass(ModifierBelongsToAllRaces)) && super._filterPotentialCardInAura(card);
  }
}
ModifierFeralu.initClass();

module.exports = ModifierFeralu;
