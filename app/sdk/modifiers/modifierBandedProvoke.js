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
const ModifierBanded = require('./modifierBanded');
const ModifierProvoke = require('./modifierProvoke');

class ModifierBandedProvoke extends ModifierProvoke {
  static initClass() {
    this.prototype.type = 'ModifierBandedProvoke';
    this.type = 'ModifierBandedProvoke';
  }
}
ModifierBandedProvoke.initClass();

module.exports = ModifierBandedProvoke;
