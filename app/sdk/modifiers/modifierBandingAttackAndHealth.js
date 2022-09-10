/* eslint-disable
    import/no-unresolved,
    no-param-reassign,
    no-return-assign,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Stringifiers = 				require('app/sdk/helpers/stringifiers');
const ModifierBanding = 				require('./modifierBanding');
const ModifierBanded = 			require('./modifierBanded');

class ModifierBandingAttackAndHealth extends ModifierBanding {
  static initClass() {
    this.prototype.type = 'ModifierBandingAttackAndHealth';
    this.type = 'ModifierBandingAttackAndHealth';

    this.description = 'Gains %X / %Y';

    this.prototype.fxResource = ['FX.Modifiers.ModifierZeal', 'FX.Modifiers.ModifierZealAttackAndHealth'];
  }

  static createContextObject(attackBuff, healthBuff, options) {
    if (attackBuff == null) { attackBuff = 0; }
    if (healthBuff == null) { healthBuff = 0; }
    if (options == null) { options = undefined; }
    const contextObject = super.createContextObject(options);
    contextObject.appliedName = 'Zeal: Lion\'s Fortitude';
    const buffContextObject = ModifierBanded.createContextObject(attackBuff, healthBuff);
    buffContextObject.appliedName = 'Zealed: Lion\'s Fortitude';
    contextObject.modifiersContextObjects = [buffContextObject];
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      const subContextObject = modifierContextObject.modifiersContextObjects[0];
      let replaceText = this.description.replace(/%X/, Stringifiers.stringifyStatBuff(subContextObject.attributeBuffs.atk));
      return replaceText = replaceText.replace(/%Y/, Stringifiers.stringifyStatBuff(subContextObject.attributeBuffs.maxHP));
    }
    return this.description;
  }
}
ModifierBandingAttackAndHealth.initClass();

module.exports = ModifierBandingAttackAndHealth;
