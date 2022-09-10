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

class ModifierEnemyAttackWatch extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierEnemyAttackWatch';
    this.type = 'ModifierEnemyAttackWatch';

    this.modifierName = 'ModifierEnemyAttackWatch';
    this.description = 'Whenever an enemy attacks...';

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
    if (action instanceof AttackAction && (source.getOwner() !== this.getCard().getOwner()) && !action.getIsImplicit()) {
      return this.onEnemyAttackWatch(action);
    }
  }

  onEnemyAttackWatch(action) {}
}
ModifierEnemyAttackWatch.initClass();
// override me in sub classes to implement special behavior

module.exports = ModifierEnemyAttackWatch;
