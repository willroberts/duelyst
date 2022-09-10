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
const CardType = require('app/sdk/cards/cardType');
const Modifier = require('./modifier');

class ModifierMyAttackMinionWatch extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierMyAttackMinionWatch';
    this.type = 'ModifierMyAttackMinionWatch';

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;

    this.prototype.fxResource = ['FX.Modifiers.ModifierMyAttackWatch'];
  }

  onAction(event) {
    super.onAction(event);
    const {
      action,
    } = event;
    if (action instanceof AttackAction && (action.getSource() === this.getCard()) && (!action.getIsImplicit() || action.getIsAutomatic()) && !action.getTarget().getIsGeneral()) {
      return this.onMyAttackMinionWatch(action);
    }
  }

  onMyAttackMinionWatch(action) {}
}
ModifierMyAttackMinionWatch.initClass();
// override me in sub classes to implement special behavior

module.exports = ModifierMyAttackMinionWatch;
