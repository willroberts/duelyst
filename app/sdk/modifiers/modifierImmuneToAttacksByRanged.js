/* eslint-disable
    import/no-unresolved,
    max-len,
    no-tabs,
    no-underscore-dangle,
    no-use-before-define,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const AttackAction = 	require('app/sdk/actions/attackAction');
const ModifierImmuneToAttacks = 	require('./modifierImmuneToAttacks');

/*
  Modifier that invalidates attacks against this unit from sources that are ranged.
*/

class ModifierImmuneToAttacksByRanged extends ModifierImmuneToAttacks {
  static initClass() {
    this.prototype.type = 'ModifierImmuneToAttacksByRanged';
    this.type = 'ModifierImmuneToAttacksByRanged';

    this.modifierName = 'Ranged Immunity';
    this.description = 'Cannot be attacked by ranged minions';
  }

  getIsActionRelevant(a) {
    return (this.getCard() != null) && a instanceof AttackAction && a.getIsValid() && (this.getCard() === a.getTarget()) && __guard__(a.getSource(), (x) => x.isRanged());
  }
}
ModifierImmuneToAttacksByRanged.initClass();

module.exports = ModifierImmuneToAttacksByRanged;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
