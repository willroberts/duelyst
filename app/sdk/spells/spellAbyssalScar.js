/* eslint-disable
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const DamageAction = require('app/sdk/actions/damageAction');
const _ = require('underscore');
const SpellApplyModifiers = require('./spellApplyModifiers');

class SpellAbyssalScar extends SpellApplyModifiers {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    const applyEffectPosition = { x, y };
    const unit = board.getUnitAtPosition(applyEffectPosition);
    const damageAction = new DamageAction(this.getGameSession());
    damageAction.setOwnerId(this.getOwnerId());
    damageAction.setTarget(unit);
    damageAction.setDamageAmount(this.damageAmount);
    this.getGameSession().executeAction(damageAction);
    this.targetModifiersContextObjects[0].spawnOwnerId = this.getOwnerId();
    return super.onApplyEffectToBoardTile(board, x, y, sourceAction);
  }
}

module.exports = SpellAbyssalScar;
