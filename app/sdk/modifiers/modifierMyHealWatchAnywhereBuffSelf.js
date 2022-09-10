/* eslint-disable
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
const Modifier = require('./modifier');
const ModifierMyHealWatchAnywhere = require('./modifierMyHealWatchAnywhere');

class ModifierMyHealWatchAnywhereBuffSelf extends ModifierMyHealWatchAnywhere {
  static initClass() {
    this.prototype.type = 'ModifierMyHealWatchAnywhereBuffSelf';
    this.type = 'ModifierMyHealWatchAnywhereBuffSelf';

    this.modifierName = 'My Heal Watch Anywhere Buff Self';
    this.description = 'This minion gains %X for each time you healed anything this game';
  }

  static createContextObject(attackBuff, maxHPBuff, options) {
    if (attackBuff == null) { attackBuff = 0; }
    if (maxHPBuff == null) { maxHPBuff = 0; }
    const contextObject = super.createContextObject(options);
    const statContextObject = Modifier.createContextObjectWithAttributeBuffs(attackBuff, maxHPBuff);
    statContextObject.appliedName = 'Excelsior!';
    contextObject.modifiersContextObjects = [statContextObject];
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      const subContextObject = modifierContextObject.modifiersContextObjects[0];
      return this.description.replace(/%X/, Stringifiers.stringifyAttackHealthBuff(subContextObject.attributeBuffs.atk, subContextObject.attributeBuffs.maxHP));
    }
    return this.description;
  }

  onHealWatch(action) {
    return this.applyManagedModifiersFromModifiersContextObjects(this.modifiersContextObjects, this.getCard());
  }
}
ModifierMyHealWatchAnywhereBuffSelf.initClass();

module.exports = ModifierMyHealWatchAnywhereBuffSelf;
