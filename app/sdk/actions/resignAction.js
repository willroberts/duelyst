/* eslint-disable
    class-methods-use-this,
    import/no-unresolved,
    no-return-assign,
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
const Logger = require('app/common/logger');
const GameStatus = require('app/sdk/gameStatus');
const DieAction = require('./dieAction');

class ResignAction extends DieAction {
  static initClass() {
    this.type = 'ResignAction';
  }

  constructor() {
    if (this.type == null) { this.type = ResignAction.type; }
    super(...arguments);
  }

  isRemovableDuringScrubbing() {
    return false;
  }

  _execute() {
    super._execute();
    return this.getGameSession().getPlayerById(this.getOwnerId()).hasResigned = true;
  }
}
ResignAction.initClass();

module.exports = ResignAction;
