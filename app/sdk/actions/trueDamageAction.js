/* eslint-disable
    max-len,
    no-tabs,
    no-this-before-super,
    prefer-rest-params,
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
const _ = require('underscore');
const DamageAction = 		require('./damageAction');

/*
  True damage actions cannot be modified in any way and always deals the exact damage initially set in the action.
*/
class TrueDamageAction extends DamageAction {
  static initClass() {
    this.type = 'TrueDamageAction';
  }

  constructor() {
    if (this.type == null) { this.type = TrueDamageAction.type; }
    super(...arguments);
  }

  getTotalDamageAmount() {
    return this.getDamageAmount();
  }
}
TrueDamageAction.initClass();

module.exports = TrueDamageAction;
