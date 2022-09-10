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
const PlayerModifier = require('./playerModifier');

class PlayerModifierFriendlyAttackWatch extends PlayerModifier {
  static initClass() {
    this.prototype.type = 'PlayerModifierFriendlyAttackWatch';
    this.type = 'PlayerModifierFriendlyAttackWatch';

    this.modifierName = 'PlayerModifierFriendlyAttackWatch';
    this.description = 'Whenever you attack with a friendly entity...';
  }

  onAction(event) {
    super.onAction(event);
    const {
      action,
    } = event;
    const source = action.getSource();

    if (action instanceof AttackAction && (source.getOwnerId() === this.getOwnerId()) && !action.getIsImplicit()) {
      return this.onFriendlyAttackWatch(action);
    }
  }

  onFriendlyAttackWatch(action) {}
}
PlayerModifierFriendlyAttackWatch.initClass();
// override me in sub classes to implement special behavior

module.exports = PlayerModifierFriendlyAttackWatch;
