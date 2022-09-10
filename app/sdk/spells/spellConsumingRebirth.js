/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Modifier = require('app/sdk/modifiers/modifier');
const PlayerModifierEndTurnRespawnEntityWithBuff = require('app/sdk/playerModifiers/playerModifierEndTurnRespawnEntityWithBuff');
const SpellKillTarget = 	require('./spellKillTarget');

class SpellConsumingRebirth extends SpellKillTarget {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    // get the target
    const target = board.getCardAtPosition({ x, y }, this.targetType);

    // kill the target
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    // apply respawn and buff modifier to target's general
    if (target != null) {
      const myGeneral = this.getGameSession().getGeneralForPlayerId(target.getOwnerId());
      if (myGeneral != null) {
        const buffContextObject = Modifier.createContextObjectWithAttributeBuffs(1, 1);
        buffContextObject.appliedName = 'Consumed and Reborn';
        const respawnContextObject = PlayerModifierEndTurnRespawnEntityWithBuff.createContextObject(target.createNewCardData(), [buffContextObject], target.getPosition());
        return this.getGameSession().applyModifierContextObject(respawnContextObject, myGeneral);
      }
    }
  }
}

module.exports = SpellConsumingRebirth;
