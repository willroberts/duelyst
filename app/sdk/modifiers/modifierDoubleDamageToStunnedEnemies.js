/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-underscore-dangle,
    no-use-before-define,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const EVENTS = require('app/common/event_types');
const DamageAction = require('app/sdk/actions/damageAction');
const CardType = require('app/sdk/cards/cardType');
const ModifierStunned = require('app/sdk/modifiers/modifierStunned');
const Modifier = require('./modifier');

class ModifierDoubleDamageToStunnedEnemies extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierDoubleDamageToStunnedEnemies';
    this.type = 'ModifierDoubleDamageToStunnedEnemies';

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;

    this.prototype.damageBonus = 2;

    this.prototype.fxResource = ['FX.Modifiers.ModifierDoubleDamageToEnemyMinions'];
  }

  onEvent(event) {
    super.onEvent(event);

    if (this._private.listeningToEvents) {
      if (event.type === EVENTS.modify_action_for_entities_involved_in_attack) {
        return this.onModifyActionForEntitiesInvolvedInAttack(event);
      }
    }
  }

  getIsActionRelevant(a) {
    return a instanceof DamageAction && (a.getSource() === this.getCard()) && __guard__(a.getTarget(), (x) => x.hasActiveModifierClass(ModifierStunned)) && (__guard__(a.getTarget(), (x1) => x1.getOwnerId()) !== this.getCard().getOwnerId());
  }

  _modifyAction(a) {
    a.setChangedByModifier(this);
    return a.changeDamageMultiplierBy(this.damageBonus);
  }

  onModifyActionForExecution(actionEvent) {
    super.onModifyActionForExecution(actionEvent);
    const a = actionEvent.action;
    if (this.getIsActionRelevant(a)) {
      return this._modifyAction(a);
    }
  }

  onModifyActionForEntitiesInvolvedInAttack(actionEvent) {
    const a = actionEvent.action;
    if (this.getIsActive() && this.getIsActionRelevant(a)) {
      return this._modifyAction(a);
    }
  }
}
ModifierDoubleDamageToStunnedEnemies.initClass();

module.exports = ModifierDoubleDamageToStunnedEnemies;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
