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
const AttackAction = require('app/sdk/actions/attackAction');
const Modifier = require('./modifier');

class ModifierMyGeneralAttackWatch extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierMyGeneralAttackWatch';
    this.type = 'ModifierMyGeneralAttackWatch';

    this.modifierName = 'Attack Watch: My General';
    this.description = 'Attack Watch: My General';

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;
  }

  onAction(event) {
    super.onAction(event);
    const {
      action,
    } = event;
    const source = action.getSource();
    if (action instanceof AttackAction && (source.getOwner() === this.getCard().getOwner()) && source.getIsGeneral() && !action.getIsImplicit()) {
      return this.onMyGeneralAttackWatch(action);
    }
  }

  onMyGeneralAttackWatch(action) {}
}
ModifierMyGeneralAttackWatch.initClass();
// override me in sub classes to implement special behavior

module.exports = ModifierMyGeneralAttackWatch;
