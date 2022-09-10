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
const MoveAction = require('app/sdk/actions/moveAction');
const AttackAction = require('app/sdk/actions/attackAction');
const Entity = require('app/sdk/entities/entity');
const i18next = require('i18next');
const Validator = require('./validator');

class ValidatorEntityAction extends Validator {
  static initClass() {
    this.prototype.type = 'ValidatorEntityAction';
    this.type = 'ValidatorEntityAction';
  }

  onValidateAction(event) {
    super.onValidateAction(event);
    const {
      action,
    } = event;
    if ((action != null) && action.getIsValid() && !action.getIsImplicit()) {
      let source; let
        targetPosition;
      if (action.getType() === MoveAction.type) {
        source = action.getSource();
        targetPosition = action.getTargetPosition();
        if (!(source instanceof Entity)) {
          return this.invalidateAction(action, targetPosition, i18next.t('validators.not_a_valid_move_message'));
        } if (!source.getCanMove()) {
          return this.invalidateAction(action, action.getSourcePosition(), i18next.t('validators.unit_cannot_move_message'));
        } if (!source.getMovementRange().getIsPositionValid(this.getGameSession().getBoard(), source, targetPosition)) {
          return this.invalidateAction(action, targetPosition, i18next.t('validators.invalid_move_position_message'));
        }
      } else if (action.getType() === AttackAction.type) {
        source = action.getSource();
        targetPosition = action.getTargetPosition();
        if (!(source instanceof Entity)) {
          return this.invalidateAction(action, targetPosition, i18next.t('validators.invalid_attack_message'));
        } if (!source.getCanAttack() && !action.getIsAutomatic()) {
          return this.invalidateAction(action, action.getSourcePosition(), i18next.t('validators.unit_cannot_attack_message'));
        } if (!source.getAttackRange().getIsPositionValid(this.getGameSession().getBoard(), source, targetPosition)) {
          return this.invalidateAction(action, targetPosition, i18next.t('validators.invalid_attack_position_message'));
        }
      }
    }
  }
}
ValidatorEntityAction.initClass();

module.exports = ValidatorEntityAction;
