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
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const PutCardInDeckAction = require('app/sdk/actions/putCardInDeckAction');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const ModifierIntensify = require('./modifierIntensify');

class ModifierIntensifyOneManArmy extends ModifierIntensify {
  static initClass() {
    this.prototype.type = 'ModifierIntensifyOneManArmy';
    this.type = 'ModifierIntensifyOneManArmy';
  }

  onIntensify() {
    for (let i = 0, end = this.getIntensifyAmount(), asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
      const addCardToHandAction = new PutCardInHandAction(this.getGameSession(), this.getCard().getOwnerId(), { id: Cards.Faction1.KingsGuard });
      this.getGameSession().executeAction(addCardToHandAction);
    }

    const putCardInDeckAction = new PutCardInDeckAction(this.getGameSession(), this.getOwnerId(), { id: Cards.Faction1.OneManArmy });
    return this.getGameSession().executeAction(putCardInDeckAction);
  }
}
ModifierIntensifyOneManArmy.initClass();

module.exports = ModifierIntensifyOneManArmy;
