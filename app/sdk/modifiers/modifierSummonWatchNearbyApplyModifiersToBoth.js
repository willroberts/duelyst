/* eslint-disable
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const ModifierSummonWatchApplyModifiersToBoth = require('./modifierSummonWatchApplyModifiersToBoth');

class ModifierSummonWatchNearbyApplyModifiersToBoth extends ModifierSummonWatchApplyModifiersToBoth {
  static initClass() {
    this.prototype.type = 'ModifierSummonWatchNearbyApplyModifiersToBoth';
    this.type = 'ModifierSummonWatchNearbyApplyModifiersToBoth';

    this.prototype.fxResource = ['FX.Modifiers.ModifierSummonWatch', 'FX.Modifiers.ModifierGenericBuff'];
  }

  static createContextObject(modifiersContextObjects, options) {
    const contextObject = super.createContextObject(options);
    contextObject.modifiersContextObjects = modifiersContextObjects;
    return contextObject;
  }

  getIsValidBuffPosition(summonedUnitPosition) {
    const entityPosition = this.getCard().getPosition();
    if ((Math.abs(summonedUnitPosition.x - entityPosition.x) <= 1) && (Math.abs(summonedUnitPosition.y - entityPosition.y) <= 1)) {
      return true;
    }
    return false;
  }
}
ModifierSummonWatchNearbyApplyModifiersToBoth.initClass();

module.exports = ModifierSummonWatchNearbyApplyModifiersToBoth;
