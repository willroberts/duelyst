/* eslint-disable
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('app/common/config');
const MoveAction = require('app/sdk/actions/moveAction');
const i18next = require('i18next');
const Modifier = require('./modifier');

class ModifierRangedProvoked extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierRangedProvoked';
    this.type = 'ModifierRangedProvoked';

    this.modifierName = i18next.t('modifiers.ranged_provoked_name');
    this.description = i18next.t('modifiers.ranged_provoked_def');

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;

    this.prototype.fxResource = ['FX.Modifiers.ModifierProvoked'];
  }
}
ModifierRangedProvoked.initClass();

module.exports = ModifierRangedProvoked;
