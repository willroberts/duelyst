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
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const ModifierBackstab = require('app/sdk/modifiers/modifierBackstab');
const PlayerModifierCardDrawModifier = require('app/sdk/playerModifiers/playerModifierCardDrawModifier');
const CardType = require('app/sdk/cards/cardType');
const SpellApplyModifiers = require('./spellApplyModifiers');

class SpellKillingEdge extends SpellApplyModifiers {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction); // apply buff

    const entity = board.getCardAtPosition({ x, y }, CardType.Unit);
    if (entity.hasModifierType(ModifierBackstab.type)) {
      const ownerId = this.getOwnerId();
      const general = this.getGameSession().getGeneralForPlayerId(ownerId);
      return this.getGameSession().applyModifierContextObject(PlayerModifierCardDrawModifier.createContextObject(1, 1), general);
    }
  }
}

module.exports = SpellKillingEdge;
