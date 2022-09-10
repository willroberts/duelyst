/* eslint-disable
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('app/common/config');
const i18next = require('i18next');
const ModifierBanded = require('./modifierBanded');
const ModifierRanged = require('./modifierRanged');

class ModifierBandedRanged extends ModifierRanged {
  static initClass() {
    this.prototype.type = 'ModifierBandedRanged';
    this.type = 'ModifierBandedRanged';

    this.modifierName = i18next.t('modifiers.banded_ranged_name');
    this.description = i18next.t('modifiers.banded_ranged_def');

    this.prototype.fxResource = ['FX.Modifiers.ModifierZealed', 'FX.Modifiers.ModifierZealedRanged'];
  }
}
ModifierBandedRanged.initClass();

module.exports = ModifierBandedRanged;
