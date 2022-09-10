/* eslint-disable
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PlayerModifierEndTurnWatchRevertBBS = require('app/sdk/playerModifiers/playerModifierEndTurnWatchRevertBBS');
const ModifierOpeningGambit = require('./modifierOpeningGambit');

class ModifierOpeningGambitChangeSignatureCard extends ModifierOpeningGambit {
  static initClass() {
    this.prototype.type = 'ModifierOpeningGambitChangeSignatureCard';
    this.type = 'ModifierOpeningGambitChangeSignatureCard';

    this.modifierName = 'Opening Gambit';
    this.description = 'Your Bloodbound Spell is %X';

    this.prototype.fxResource = ['FX.Modifiers.ModifierOpeningGambit'];
  }

  static createContextObject(cardData, cardDescription) {
    const contextObject = super.createContextObject();
    contextObject.cardData = cardData;
    contextObject.cardDescription = cardDescription;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    return this.description.replace(/%X/, modifierContextObject.cardDescription);
  }

  onOpeningGambit(action) {
    super.onOpeningGambit(action);

    const general = this.getGameSession().getGeneralForPlayerId(this.getCard().getOwnerId());

    // If a revert bbs modifier exists from a temp BBS, remove it, new BBS overwrites it
    for (const modifier of Array.from(general.getModifiersByClass(PlayerModifierEndTurnWatchRevertBBS))) {
      this.getGameSession().removeModifier(modifier);
    }

    general.setSignatureCardData(this.cardData);
    return this.getGameSession().executeAction(general.getOwner().actionGenerateSignatureCard());
  }
}
ModifierOpeningGambitChangeSignatureCard.initClass();

module.exports = ModifierOpeningGambitChangeSignatureCard;
