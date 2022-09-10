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

class ModifierCounterIntensifyDescription extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierCounterIntensifyDescription';
    this.type = 'ModifierCounterIntensifyDescription';

    this.prototype.maxStacks = 1;
  }

  static createContextObject(intensifyLevel) {
    const contextObject = super.createContextObject();
    contextObject.intensifyLevel = intensifyLevel;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return i18next.t('modifiers.intensify_counter_applied_desc', { intensify_effect_level: modifierContextObject.intensifyLevel });
    }
  }
}
ModifierCounterIntensifyDescription.initClass();

module.exports = ModifierCounterIntensifyDescription;
