/* eslint-disable
    import/no-unresolved,
    max-len,
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
const CardType = require('app/sdk/cards/cardType');
const Action = require('./action');

class RemoveAction extends Action {
  static initClass() {
    this.type = 'RemoveAction';
  }

  constructor() {
    if (this.type == null) { this.type = RemoveAction.type; }
    super(...arguments);
  }

  _execute() {
    super._execute();

    const target = this.getTarget();
    const targetPosition = this.getTargetPosition();

    return this.getGameSession().removeCardFromBoard(target, targetPosition.x, targetPosition.y, this);
  }
}
RemoveAction.initClass();

module.exports = RemoveAction;
