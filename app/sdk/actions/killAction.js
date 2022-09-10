/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
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
const Logger = 		require('app/common/logger');
const CardType = 			require('app/sdk/cards/cardType');
const _ = require('underscore');
const Action = require('./action');

class KillAction extends Action {
  static initClass() {
    this.type = 'KillAction';
    this.prototype.damageAmount = null;
  }

  constructor() {
    if (this.type == null) { this.type = KillAction.type; }
    super(...arguments);
  }

  _execute() {
    super._execute();

    const source = this.getSource();
    const target = this.getTarget();

    if (target) {
      // Logger.module("SDK").debug "[G:#{@.getGameSession().gameId}]", "#{this.type}::execute - kill #{target.getName()}.".red
      const dieAction = target.actionDie(source);
      return this.getGameSession().executeAction(dieAction);
    }
  }
}
KillAction.initClass();

module.exports = KillAction;
