/* eslint-disable
    import/no-unresolved,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = 		require('app/common/config');
const Logger = require('app/common/logger');
const AttackAction = 	require('app/sdk/actions/attackAction');
const _ = require('underscore');

const i18next = require('i18next');
const ModifierProvoked = 	require('./modifierProvoked');
const Modifier = 	require('./modifier');

class ModifierProvoke extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierProvoke';
    this.type = 'ModifierProvoke';

    this.isKeyworded = true;
    this.keywordDefinition = i18next.t('modifiers.provoke_def');
    this.prototype.maxStacks = 1;

    this.modifierName = i18next.t('modifiers.provoke_name');
    this.description = null;

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;

    this.prototype.isAura = true;
    this.prototype.auraRadius = 1;
    this.prototype.auraIncludeSelf = false;
    this.prototype.auraIncludeAlly = false;
    this.prototype.auraIncludeEnemy = true;

    this.prototype.modifiersContextObjects = [ModifierProvoked.createContextObject()];
    this.prototype.fxResource = ['FX.Modifiers.ModifierProvoke'];
  }
}
ModifierProvoke.initClass();

module.exports = ModifierProvoke;
