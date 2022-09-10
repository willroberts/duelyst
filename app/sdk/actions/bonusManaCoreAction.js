/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-this-before-super,
    no-underscore-dangle,
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
const CONFIG = require('app/common/config');
const Action = require('./action');

class BonusManaCoreAction extends Action {
  static initClass() {
    // grants one permanent extra mana core (up to CONFIG.MAX_MANA)

    this.type = 'BonusManaCoreAction';
  }

  constructor(gameSession) {
    if (this.type == null) { this.type = BonusManaCoreAction.type; }
    super(gameSession);
  }

  _execute() {
    super._execute();

    const owner = this.getOwner();
    if (owner != null) {
      // Logger.module("SDK").debug "[G:#{@.getGameSession().gameId}]", "BonusManaCoreAction::execute for #{owner} grant 1 bonus mana core"
      if (owner.getMaximumMana() < CONFIG.MAX_MANA) {
        return owner.maximumMana++;
      }
    }
  }
}
BonusManaCoreAction.initClass();

module.exports = BonusManaCoreAction;
