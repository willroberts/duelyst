// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const i18next = require('i18next');
const Modifier = require('./modifier');

class ModifierGrowOnBothTurns extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierGrowOnBothTurns';
    this.type = 'ModifierGrowOnBothTurns';

    this.modifierName = i18next.t('modifiers.grow_on_both_turns_name');
    this.description = i18next.t('modifiers.grow_on_both_turns_def');

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;

    this.prototype.fxResource = ['FX.Modifiers.ModifierGrowOnBothTurns'];
  }
}
ModifierGrowOnBothTurns.initClass();

module.exports = ModifierGrowOnBothTurns;
