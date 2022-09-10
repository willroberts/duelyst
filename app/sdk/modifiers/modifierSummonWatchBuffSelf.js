/* eslint-disable
    default-param-last,
    import/no-unresolved,
    max-len,
    no-param-reassign,
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
const Stringifiers = require('app/sdk/helpers/stringifiers');
const ModifierSummonWatch = require('./modifierSummonWatch');
const Modifier = require('./modifier');

class ModifierSummonWatchBuffSelf extends ModifierSummonWatch {
  static initClass() {
    this.prototype.type = 'ModifierSummonWatchBuffSelf';
    this.type = 'ModifierSummonWatchBuffSelf';

    this.modifierName = 'Summon Watch';
    this.description = 'Whenever you summon a minion, this minion gains %X';

    this.prototype.fxResource = ['FX.Modifiers.ModifierSummonWatch', 'FX.Modifiers.ModifierGenericBuff'];
  }

  static createContextObject(attackBuff, maxHPBuff, appliedName = null, options) {
    if (attackBuff == null) { attackBuff = 0; }
    if (maxHPBuff == null) { maxHPBuff = 0; }
    const contextObject = super.createContextObject(options);
    contextObject.modifiersContextObjects = [
      Modifier.createContextObjectWithAttributeBuffs(attackBuff, maxHPBuff, {
        modifierName: this.modifierName,
        description: Stringifiers.stringifyAttackHealthBuff(attackBuff, maxHPBuff),
        appliedName,
      }),
    ];
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      const subContextObject = modifierContextObject.modifiersContextObjects[0];
      return this.description.replace(/%X/, Stringifiers.stringifyAttackHealthBuff(subContextObject.attributeBuffs.atk, subContextObject.attributeBuffs.maxHP));
    }
    return this.description;
  }

  onSummonWatch(action) {
    return this.applyManagedModifiersFromModifiersContextObjects(this.modifiersContextObjects, this.getCard());
  }
}
ModifierSummonWatchBuffSelf.initClass();

module.exports = ModifierSummonWatchBuffSelf;
