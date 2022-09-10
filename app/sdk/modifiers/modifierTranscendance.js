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
const CardType = require('app/sdk/cards/cardType');
const i18next = require('i18next');
const Modifier = require('./modifier');

class ModifierTranscendance extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierTranscendance';
    this.type = 'ModifierTranscendance';

    this.isKeyworded = true;
    this.keywordDefinition = i18next.t('modifiers.celerity_def');

    this.modifierName = i18next.t('modifiers.celerity_name');
    this.description = '';

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;

    this.prototype.maxStacks = 1;

    this.prototype.attributeBuffs = {
      attacks: 1,
      moves: 1,
    };

    this.prototype.fxResource = ['FX.Modifiers.ModifierCelerity'];
  }
}
ModifierTranscendance.initClass();

module.exports = ModifierTranscendance;
