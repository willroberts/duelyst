/* eslint-disable
    consistent-return,
    import/no-unresolved,
    no-tabs,
    no-this-before-super,
    no-underscore-dangle,
    prefer-rest-params,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = 			require('app/sdk/cards/cardType');
const Action = require('./action');

class ApplyExhaustionAction extends Action {
  static initClass() {
    this.type = 'ApplyExhaustionAction';
  }

  constructor(gameSession) {
    if (this.type == null) { this.type = ApplyExhaustionAction.type; }
    super(...arguments);
  }

  _execute() {
    super._execute();
    const target = this.getTarget();
    if (target != null) {
      return target.applyExhaustion();
    }
  }
}
ApplyExhaustionAction.initClass();

module.exports = ApplyExhaustionAction;
