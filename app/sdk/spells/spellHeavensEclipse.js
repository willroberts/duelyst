/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-restricted-syntax,
    no-tabs,
    no-underscore-dangle,
    no-use-before-define,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Logger = require('app/common/logger');
const CardType = require('app/sdk/cards/cardType');
const Spell = 	require('./spell');

class SpellHeavensEclipse extends Spell {
  static initClass() {
    this.prototype.numSpells = 3;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    let cardIndex;
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    // find all spells in the deck
    const cardIndicesToDraw = [];
    const drawPile = this.getOwner().getDeck().getDrawPile();
    const indexOfSpells = [];
    for (let i = 0; i < drawPile.length; i++) {
      cardIndex = drawPile[i];
      if (__guard__(this.getGameSession().getCardByIndex(cardIndex), (x1) => x1.getType()) === CardType.Spell) {
        indexOfSpells.push(i);
      }
    }

    // find X random spells
    for (let j = 0, end = this.numSpells, asc = end >= 0; asc ? j < end : j > end; asc ? j++ : j--) {
      if (indexOfSpells.length > 0) {
        const spellIndexToRemove = this.getGameSession().getRandomIntegerForExecution(indexOfSpells.length);
        const indexOfCardInDeck = indexOfSpells[spellIndexToRemove];
        indexOfSpells.splice(spellIndexToRemove, 1);
        cardIndicesToDraw.push(drawPile[indexOfCardInDeck]);
      }
    }

    // create put card in hand action
    if (cardIndicesToDraw && (cardIndicesToDraw.length > 0)) {
      return (() => {
        const result = [];
        for (cardIndex of Array.from(cardIndicesToDraw)) {
          const drawCardAction = this.getGameSession().getPlayerById(this.getOwner().getPlayerId()).getDeck().actionDrawCard(cardIndex);
          result.push(this.getGameSession().executeAction(drawCardAction));
        }
        return result;
      })();
    }
  }
}
SpellHeavensEclipse.initClass();

module.exports = SpellHeavensEclipse;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
