// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const i18next = require('i18next');
const Modifier = require('./modifier');

class ModifierBelongsToAllRaces extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierBelongsToAllRaces';
    this.type = 'ModifierBelongsToAllRaces';

    this.modifierName = i18next.t('modifiers.belongs_to_all_races_name');
    this.description = i18next.t('modifiers.belongs_to_all_races_def');

    this.prototype.fxResource = ['FX.Modifiers.ModifierBelongsToAllRaces'];
  }
}
ModifierBelongsToAllRaces.initClass();

module.exports = ModifierBelongsToAllRaces;
