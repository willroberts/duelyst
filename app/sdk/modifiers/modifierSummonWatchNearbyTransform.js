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
const ModifierSummonWatchTransform = require('./modifierSummonWatchTransform');

class ModifierSummonWatchNearbyTransform extends ModifierSummonWatchTransform {
  static initClass() {
    this.prototype.type = 'ModifierSummonWatchNearbyTransform';
    this.type = 'ModifierSummonWatchNearbyTransform';

    this.prototype.fxResource = ['FX.Modifiers.ModifierSummonWatch'];
  }

  getIsValidTransformPosition(summonedUnitPosition) {
    const entityPosition = this.getCard().getPosition();
    if ((Math.abs(summonedUnitPosition.x - entityPosition.x) <= 1) && (Math.abs(summonedUnitPosition.y - entityPosition.y) <= 1)) {
      return true;
    }
    return false;
  }
}
ModifierSummonWatchNearbyTransform.initClass();

module.exports = ModifierSummonWatchNearbyTransform;
