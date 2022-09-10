/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-plusplus,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const PutCardInDeckAction = require('app/sdk/actions/putCardInDeckAction');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const Spell = require('./spell');

class SpellDejaVu extends Spell {
  onApplyOneEffectToBoard(board, x, y, sourceAction) {
    const spellsPlayedToBoard = this.getGameSession().getSpellsPlayed();
    const ownerId = this.getOwnerId();
    if (spellsPlayedToBoard.length > 0) {
      let spellToCopy;
      for (let i = spellsPlayedToBoard.length - 1; i >= 0; i--) {
        const spell = spellsPlayedToBoard[i];
        if (!spell.getIsFollowup() && (spell.getOwnerId() === ownerId) && !(spell === this) && !(spell.getBaseCardId() === Cards.Spell.DejaVu)) {
          spellToCopy = spell;
          break;
        }
      }

      if (spellToCopy != null) {
        // put fresh copy of spell into deck
        const a = new PutCardInDeckAction(this.getGameSession(), ownerId, spellToCopy.createNewCardData());
        this.getGameSession().executeAction(a);
        const b = new PutCardInDeckAction(this.getGameSession(), ownerId, spellToCopy.createNewCardData());
        this.getGameSession().executeAction(b);
        const c = new PutCardInDeckAction(this.getGameSession(), ownerId, spellToCopy.createNewCardData());
        this.getGameSession().executeAction(c);
        const d = new PutCardInDeckAction(this.getGameSession(), ownerId, spellToCopy.createNewCardData());
        this.getGameSession().executeAction(d);
        const e = new PutCardInDeckAction(this.getGameSession(), ownerId, spellToCopy.createNewCardData());
        return this.getGameSession().executeAction(e);
      }
    }
  }
}

module.exports = SpellDejaVu;
