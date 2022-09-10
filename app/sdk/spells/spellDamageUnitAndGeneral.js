/* eslint-disable
    max-len,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
const SpellDamage = require('./spellDamage');

class SpellDamageUnitAndGeneral extends SpellDamage {
  _findApplyEffectPositions(position, sourceAction) {
    const applyEffectPositions = super._findApplyEffectPositions(position, sourceAction);
    const general = this.getGameSession().getGeneralForPlayerId(this.getGameSession().getOpponentPlayerOfPlayerId(this.getOwnerId()).getPlayerId());
    applyEffectPositions.push(general.getPosition());
    return applyEffectPositions;
  }
}

module.exports = SpellDamageUnitAndGeneral;
