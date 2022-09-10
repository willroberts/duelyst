/* eslint-disable
    import/no-unresolved,
    max-len,
    no-plusplus,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('app/common/config');
const UtilsGameSession = require('app/common/utils/utils_game_session');
const CardType = require('app/sdk/cards/cardType');
const _ = require('underscore');
const ModifierBond = require('./modifierBond');
const Modifier = require('./modifier');

class ModifierBondDrawCards extends ModifierBond {
  static initClass() {
    this.prototype.type = 'ModifierBondDrawCards';
    this.type = 'ModifierBondDrawCards';

    this.description = 'Draw some cards from the deck';

    this.prototype.fxResource = ['FX.Modifiers.ModifierBond'];
  }

  static createContextObject(numCards) {
    const contextObject = super.createContextObject();
    contextObject.numCards = numCards;
    return contextObject;
  }

  onBond() {
    return (() => {
      const result = [];
      for (let i = 0, end = this.numCards, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
        const deck = this.getGameSession().getPlayerById(this.getCard().getOwnerId()).getDeck();
        result.push(this.getCard().getGameSession().executeAction(deck.actionDrawCard()));
      }
      return result;
    })();
  }
}
ModifierBondDrawCards.initClass();

module.exports = ModifierBondDrawCards;
