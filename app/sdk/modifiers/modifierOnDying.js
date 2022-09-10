/* eslint-disable
    class-methods-use-this,
    consistent-return,
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const DieAction = require('app/sdk/actions/dieAction');
const Modifier = require('./modifier');

class ModifierOnDying extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierOnDying';
    this.type = 'ModifierOnDying';

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;
  }

  onAction(e) {
    super.onAction(e);

    const {
      action,
    } = e;

    // when our entity has died
    if (action instanceof DieAction && (action.getTarget() === this.getCard()) && this.getCard().getIsRemoved()) {
      return this.onDying(action);
    }
  }

  onDying(action) {}
}
ModifierOnDying.initClass();
// override me in sub classes to implement special behavior

module.exports = ModifierOnDying;
