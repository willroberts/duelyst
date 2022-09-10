/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const ModifierOpeningGambit = 	require('./modifierOpeningGambit');

class ModifierOpeningGambitRetrieveMostRecentSpell extends ModifierOpeningGambit {
  static initClass() {
    this.prototype.type = 'ModifierOpeningGambitRetrieveMostRecentSpell';
    this.type = 'ModifierOpeningGambitRetrieveMostRecentSpell';

    this.modifierName = 'Opening Gambit';
    this.description = 'Put a copy of the most recently cast spell into your action bar';
  }

  onOpeningGambit() {
    const spellsPlayedToBoard = this.getGameSession().getSpellsPlayed();
    if (spellsPlayedToBoard.length > 0) {
      let spellToCopy;
      for (let i = spellsPlayedToBoard.length - 1; i >= 0; i--) {
        const spell = spellsPlayedToBoard[i];
        if (!spell.getIsFollowup()) {
          spellToCopy = spell;
          break;
        }
      }

      if (spellToCopy != null) {
        // put fresh copy of spell into hand
        const a = new PutCardInHandAction(this.getGameSession(), this.getCard().getOwnerId(), spellToCopy.createNewCardData());
        return this.getGameSession().executeAction(a);
      }
    }
  }
}
ModifierOpeningGambitRetrieveMostRecentSpell.initClass();

module.exports = ModifierOpeningGambitRetrieveMostRecentSpell;
