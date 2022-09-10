// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const i18next = require('i18next');
const Modifier = require('./modifier');

class ModifierHallowedGroundBuff extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierHallowedGroundBuff';
    this.type = 'ModifierHallowedGroundBuff';

    this.modifierName = i18next.t('modifiers.hallowed_ground_buff_name');
    this.description = i18next.t('modifiers.hallowed_ground_buff_def');

    this.isHiddenToUI = true;
  }

  static createContextObject(options) {
    const contextObject = super.createContextObject(options);
    const modifiersContextObjects = [Modifier.createContextObject()];
    modifiersContextObjects[0].description = this.description;
    modifiersContextObjects[0].modifierName = this.modifierName;
    contextObject.activeInHand = false;
    contextObject.activeInDeck = false;
    contextObject.activeInSignatureCards = false;
    contextObject.activeOnBoard = true;
    contextObject.modifiersContextObjects = modifiersContextObjects;
    contextObject.isAura = true;
    contextObject.auraIncludeSelf = false;
    contextObject.auraIncludeAlly = true;
    contextObject.auraIncludeEnemy = false;
    contextObject.auraIncludeGeneral = true;
    contextObject.auraRadius = 0;
    return contextObject;
  }
}
ModifierHallowedGroundBuff.initClass();

module.exports = ModifierHallowedGroundBuff;
