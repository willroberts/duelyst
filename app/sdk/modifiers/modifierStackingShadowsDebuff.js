// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const i18next = require('i18next');
const Modifier = require('./modifier');

class ModifierStackingShadowsDebuff extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierStackingShadowsDebuff';
    this.type = 'ModifierStackingShadowsDebuff';

    this.modifierName = i18next.t('modifiers.stacking_shadows_debuff_name');
    this.description = i18next.t('modifiers.stacking_shadows_debuff_def');

    this.isHiddenToUI = true;
  }

  static createContextObject(options) {
    const contextObject = super.createContextObject(options);
    const modifiersContextObjects = [Modifier.createContextObject()];
    modifiersContextObjects[0].description = i18next.t('modifiers.stacking_shadows_debuff_def');
    modifiersContextObjects[0].modifierName = i18next.t('modifiers.stacking_shadows_debuff_name');
    contextObject.activeInHand = false;
    contextObject.activeInDeck = false;
    contextObject.activeInSignatureCards = false;
    contextObject.activeOnBoard = true;
    contextObject.modifiersContextObjects = modifiersContextObjects;
    contextObject.isAura = true;
    contextObject.auraIncludeSelf = false;
    contextObject.auraIncludeAlly = false;
    contextObject.auraIncludeEnemy = true;
    contextObject.auraIncludeGeneral = true;
    contextObject.auraRadius = 0;
    return contextObject;
  }
}
ModifierStackingShadowsDebuff.initClass();

module.exports = ModifierStackingShadowsDebuff;
