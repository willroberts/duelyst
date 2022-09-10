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
const ReplaceCardFromHandAction = require('app/sdk/actions/replaceCardFromHandAction');
const i18next = require('i18next');
const ModifierCannot = require('./modifierCannot');

class ModifierCannotBeReplaced extends ModifierCannot {
  static initClass() {
    this.prototype.type = 'ModifierCannotBeReplaced';
    this.type = 'ModifierCannotBeReplaced';

    this.prototype.activeInHand = true;

    this.modifierName = i18next.t('modifiers.bound_name');
    this.description = i18next.t('modifiers.bound_desc');

    this.prototype.fxResource = ['FX.Modifiers.ModifierCannotBeReplaced'];
  }

  onValidateAction(actionEvent) {
    const a = actionEvent.action;

    if (a instanceof ReplaceCardFromHandAction && a.getIsValid() && this.getCard().getIsLocatedInHand() && (a.getOwner() === this.getCard().getOwner())) {
      if (__guard__(this.getCard().getOwner().getDeck().getCardInHandAtIndex(a.indexOfCardInHand), (x) => x.getIndex()) === this.getCard().getIndex()) {
        return this.invalidateAction(a, this.getCard().getPosition(), i18next.t('modifiers.cannot_replace_error'));
      }
    }
  }
}
ModifierCannotBeReplaced.initClass();

module.exports = ModifierCannotBeReplaced;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
