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

class ModifierCounterShadowCreepDescriptionProgressDescription extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierCounterShadowCreepDescriptionProgressDescription';
    this.type = 'ModifierCounterShadowCreepDescriptionProgressDescription';

    this.prototype.maxStacks = 1;
  }

  static createContextObject(tileCount) {
    const contextObject = super.createContextObject();
    contextObject.tileCount = tileCount;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return i18next.t('modifiers.shadowcreep_counter_applied_desc', { tile_count: modifierContextObject.tileCount });
    }
  }
}
ModifierCounterShadowCreepDescriptionProgressDescription.initClass();

module.exports = ModifierCounterShadowCreepDescriptionProgressDescription;
