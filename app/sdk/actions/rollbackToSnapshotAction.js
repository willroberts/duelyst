/* eslint-disable
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
const CONFIG = 		require('app/common/config');
const GameStatus = 	require('app/sdk/gameStatus');
const Logger = 		require('app/common/logger');
const Action = 		require('./action');

class RollbackToSnapshotAction extends Action {
  static initClass() {
    this.type = 'RollbackToSnapshotAction';

    this.prototype.delay = CONFIG.TURN_DELAY;
  }

  constructor() {
    if (this.type == null) { this.type = RollbackToSnapshotAction.type; }
    super(...arguments);
  }

  _execute() {
    // Logger.module("SDK").debug "[G:#{@.getGameSession().gameId}]", "#{this.type}::execute"
    return this.getGameSession().p_requestRollbackToSnapshot();
  }
}
RollbackToSnapshotAction.initClass();

module.exports = RollbackToSnapshotAction;
