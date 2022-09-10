/* eslint-disable
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const _ = require('underscore');
const SpellDamage = require('./spellDamage');

class SpellDamageAndPutCardInHand extends SpellDamage {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    const applyEffectPosition = { x, y };

    const a = new PutCardInHandAction(this.getGameSession(), this.getOwnerId(), this.cardDataOrIndexToPutInHand);
    this.getGameSession().executeAction(a);

    return super.onApplyEffectToBoardTile(board, x, y, sourceAction);
  }
}

module.exports = SpellDamageAndPutCardInHand;
