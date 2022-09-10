/* eslint-disable
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const DrawCardAction = require('app/sdk/actions/drawCardAction');
const CardType = require('app/sdk/cards/cardType');
const CONFIG = require('app/common/config');
const Modifier = require('./modifier');
const ModifierOpeningGambit = require('./modifierOpeningGambit');

class ModifierOpeningGambitDrawCardBothPlayers extends ModifierOpeningGambit {
  static initClass() {
    this.prototype.type = 'ModifierOpeningGambitDrawCardBothPlayers';
    this.type = 'ModifierOpeningGambitDrawCardBothPlayers';

    this.modifierName = 'Opening Gambit';
    this.description = 'Both players draw a card';

    this.prototype.fxResource = ['FX.Modifiers.ModifierOpeningGambit'];
  }

  static createContextObject(damageAmount, options) {
    const contextObject = super.createContextObject();
    contextObject.damageAmount = damageAmount;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return this.description.replace(/%X/, modifierContextObject.damageAmount);
    }
    return this.description;
  }

  onOpeningGambit() {
    const general = this.getCard().getGameSession().getGeneralForPlayerId(this.getCard().getOwnerId());
    this.getGameSession().executeAction(new DrawCardAction(this.getGameSession(), general.getOwnerId()));

    const enemyGeneral = this.getCard().getGameSession().getGeneralForOpponentOfPlayerId(this.getCard().getOwnerId());
    return this.getGameSession().executeAction(new DrawCardAction(this.getGameSession(), enemyGeneral.getOwnerId()));
  }
}
ModifierOpeningGambitDrawCardBothPlayers.initClass();

module.exports = ModifierOpeningGambitDrawCardBothPlayers;
