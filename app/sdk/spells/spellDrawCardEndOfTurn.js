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
const PlayerModifierCardDrawModifier = require('app/sdk/playerModifiers/playerModifierCardDrawModifier');
const Spell = require('./spell');

class SpellDrawCardEndOfTurn extends Spell {
  onApplyOneEffectToBoard(board, x, y, sourceAction) {
    const ownerId = this.getOwnerId();
    const general = this.getGameSession().getGeneralForPlayerId(ownerId);
    return this.getGameSession().applyModifierContextObject(PlayerModifierCardDrawModifier.createContextObject(1, 1), general);
  }
}

module.exports = SpellDrawCardEndOfTurn;
