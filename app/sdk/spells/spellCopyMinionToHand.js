/* eslint-disable
    import/no-unresolved,
    max-len,
    no-mixed-spaces-and-tabs,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const Spell = require('./spell');

class SpellCopyMinionToHand extends Spell {
  static initClass() {
    this.prototype.resetDamage = true;
		 // normally this spell will reset damage on the copied minion (but retain other buffs)
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const entity = board.getCardAtPosition({ x, y }, CardType.Unit);
    const newCardData = entity.createCloneCardData();
    if (this.resetDamage) {
      newCardData.damage = 0;
    }

    const putCardInHandAction = new PutCardInHandAction(this.getGameSession(), entity.getOwnerId(), newCardData);
    return this.getGameSession().executeAction(putCardInHandAction);
  }
}
SpellCopyMinionToHand.initClass();

module.exports = SpellCopyMinionToHand;
