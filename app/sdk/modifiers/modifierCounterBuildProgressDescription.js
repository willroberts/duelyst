/* eslint-disable
    consistent-return,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const i18next = require('i18next');
const Modifier = require('./modifier');

class ModifierCounterBuildProgressDescription extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierCounterBuildProgressDescription';
    this.type = 'ModifierCounterBuildProgressDescription';

    this.prototype.maxStacks = 1;
  }

  static createContextObject(turnsLeft) {
    const contextObject = super.createContextObject();
    contextObject.turnsLeft = turnsLeft;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return i18next.t('modifiers.building_counter_applied_desc', { turns_until_complete: modifierContextObject.turnsLeft });
    }
  }
}
ModifierCounterBuildProgressDescription.initClass();

module.exports = ModifierCounterBuildProgressDescription;
