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
const CONFIG = 		require('app/common/config');
const GameStatus = 	require('app/sdk/gameStatus');
const Logger = 		require('app/common/logger');
const Action = 		require('./action');

class TakeAnotherTurnAction extends Action {
  static initClass() {
    this.type = 'TakeAnotherTurnAction';
  }

  constructor() {
    if (this.type == null) { this.type = TakeAnotherTurnAction.type; }
    super(...arguments);
  }

  _execute() {
    // Logger.module("SDK").debug "[G:#{@.getGameSession().gameId}]", "#{this.type}::execute - setting current player to take a second turn"
    if (this.getGameSession().willSwapCurrentPlayerNextTurn()) {
      return this.getGameSession().skipSwapCurrentPlayerNextTurn();
    }
  }
}
TakeAnotherTurnAction.initClass();

module.exports = TakeAnotherTurnAction;
