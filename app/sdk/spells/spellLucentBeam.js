/* eslint-disable
    import/no-unresolved,
    no-param-reassign,
    no-plusplus,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const HealAction = require('app/sdk/actions/healAction');
const SpellDamage = require('./spellDamage');

class SpellLucentBeam extends SpellDamage {
  static initClass() {
    this.prototype.baseDamage = 2;
    this.prototype.bonusDamage = 4;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    if (this.getWasAnythingHealed()) {
      this.damageAmount = this.bonusDamage;
    } else {
      this.damageAmount = this.baseDamage;
    }
    return super.onApplyEffectToBoardTile(board, x, y, sourceAction);
  }

  getAllActionsFromParentAction(action) {
    let actions = [action];

    const subActions = action.getSubActions();
    if ((subActions != null) && (subActions.length > 0)) {
      for (let i = 0; i < subActions.length; i++) {
        action = subActions[i];
        actions = actions.concat(this.getAllActionsFromParentAction(subActions[i]));
      }
    }
    return actions;
  }

  getWasAnythingHealed() {
    let wasAnythingHealed = false;
    const turnsToCheck = [];
    turnsToCheck.push(this.getGameSession().getCurrentTurn()); // check current turn
    let actions = [];
    for (const turn of Array.from(turnsToCheck)) {
      for (const step of Array.from(turn.steps)) {
        actions = actions.concat(this.getAllActionsFromParentAction(step.getAction()));
      }
    }

    for (const action of Array.from(actions)) {
      if ((action.type === HealAction.type) && (action.getTotalHealApplied() > 0)) {
        wasAnythingHealed = true;
        break;
      }
    }

    return wasAnythingHealed;
  }
}
SpellLucentBeam.initClass();

module.exports = SpellLucentBeam;
