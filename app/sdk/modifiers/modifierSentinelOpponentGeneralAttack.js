/* eslint-disable
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
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const AttackAction = require('app/sdk/actions/attackAction');

const i18next = require('i18next');
const ModifierSentinel = require('./modifierSentinel');

class ModifierSentinelOpponentGeneralAttack extends ModifierSentinel {
  static initClass() {
    this.prototype.type = 'ModifierSentinelOpponentGeneralAttack';
    this.type = 'ModifierSentinelOpponentGeneralAttack';

    this.description = i18next.t('modifiers.sentinel_general_attack');
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject != null) {
      return this.description;
    }
    return super.getDescription();
  }

  getIsActionRelevant(action) {
    // watch for opponent General attacking
    if (action instanceof AttackAction && (action.getSource() === this.getGameSession().getGeneralForOpponentOfPlayerId(this.getCard().getOwnerId()))) {
      return true;
    }
    return false;
  }

  onOverwatch(action) {
    const newUnit = super.onOverwatch(action);
    if (this.getIsActionRelevant(action) && (action.getTarget() === this.getCard())) {
      return action.setTarget(newUnit);
    }
  }
}
ModifierSentinelOpponentGeneralAttack.initClass();

module.exports = ModifierSentinelOpponentGeneralAttack;
