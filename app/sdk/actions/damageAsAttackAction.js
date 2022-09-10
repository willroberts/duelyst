/* eslint-disable
    no-mixed-spaces-and-tabs,
    no-tabs,
    no-this-before-super,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const DamageAction = 		require('./damageAction');

/*
  Damage action that looks like an attack but is not a true attack.
*/
class DamageAsAttackAction extends DamageAction {
  static initClass() {
    this.type = 'DamageAsAttackAction';
    this.prototype.damageAmount = 0;
		 // base damage amount, should be set when action first made and then never modified
  }

  constructor(gameSession) {
    if (this.type == null) { this.type = DamageAsAttackAction.type; }
    super(gameSession);
  }

  getDamageAmount() {
    // attack damage amount is always source's atk value
    const source = this.getSource();
    if (source != null) { return source.getATK(); } return 0;
  }
}
DamageAsAttackAction.initClass();

module.exports = DamageAsAttackAction;
