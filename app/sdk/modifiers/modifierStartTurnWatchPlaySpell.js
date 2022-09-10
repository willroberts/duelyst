/* eslint-disable
    consistent-return,
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
const UtilsGameSession = require('app/common/utils/utils_game_session');
const DamageAction = require('app/sdk/actions/damageAction');
const Stringifiers = require('app/sdk/helpers/stringifiers');
const PlayCardSilentlyAction = require('app/sdk/actions/playCardSilentlyAction');
const PlayCardAction = require('app/sdk/actions/playCardAction');
const CardType = require('app/sdk/cards/cardType');
const CONFIG = require('app/common/config');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const Factions = require('app/sdk/cards/factionsLookup');
const _ = require('underscore');
const ModifierStartTurnWatch = require('./modifierStartTurnWatch');

class ModifierStartTurnWatchPlaySpell extends ModifierStartTurnWatch {
  static initClass() {
    this.prototype.type = 'ModifierStartTurnWatchPlaySpell';
    this.type = 'ModifierStartTurnWatchPlaySpell';

    this.description = 'At the start of your turn, cast %X';
  }

  static createContextObject(cardDataOrIndexToCast, cardDescription, options) {
    const contextObject = super.createContextObject(options);
    contextObject.cardDataOrIndexToCast = cardDataOrIndexToCast;
    contextObject.cardDescription = cardDescription;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return this.description.replace(/%X/, modifierContextObject.cardDescription);
    }
    return this.description;
  }

  onTurnWatch(action) {
    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      const playCardAction = new PlayCardAction(this.getGameSession(), this.getCard().getOwnerId(), this.getCard().getPosition().x, this.getCard().getPosition().y, this.cardDataOrIndexToCast);
      playCardAction.setSource(this.getCard());
      return this.getGameSession().executeAction(playCardAction);
    }
  }
}
ModifierStartTurnWatchPlaySpell.initClass();

module.exports = ModifierStartTurnWatchPlaySpell;
