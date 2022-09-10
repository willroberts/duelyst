/* eslint-disable
    import/no-unresolved,
    no-param-reassign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PlayerModifier = require('app/sdk/playerModifiers/playerModifier');
const CardType = require('app/sdk/cards/cardType');

class PlayerModifierReplaceCardModifier extends PlayerModifier {
  static initClass() {
    this.prototype.type = 'PlayerModifierReplaceCardModifier';
    this.type = 'PlayerModifierReplaceCardModifier';
  }

  static createContextObject(replaceCardChange, duration, options) {
    if (duration == null) { duration = 0; }
    const contextObject = super.createContextObject(options);
    contextObject.replaceCardChange = replaceCardChange;
    contextObject.durationEndTurn = duration;
    return contextObject;
  }

  getReplaceCardChange() {
    if (this.getIsActive()) {
      return this.replaceCardChange;
    }
    return 0;
  }
}
PlayerModifierReplaceCardModifier.initClass();

module.exports = PlayerModifierReplaceCardModifier;
