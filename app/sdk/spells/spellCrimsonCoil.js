/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PlayerModifierBattlePetManager = require('app/sdk/playerModifiers/playerModifierBattlePetManager');
const RefreshExhaustionAction =	require('app/sdk/actions/refreshExhaustionAction');
const Races = require('app/sdk/cards/racesLookup');
const SpellDamage = require('./spellDamage');

class SpellCrimsonCoil extends SpellDamage {
  onApplyOneEffectToBoard(board, x, y, sourceAction) {
    super.onApplyOneEffectToBoard(board, x, y, sourceAction);

    // activate all friendly battle pets
    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      const general = this.getGameSession().getGeneralForPlayerId(this.getOwnerId());
      return (() => {
        const result = [];
        for (const card of Array.from(this.getGameSession().getBoard().getUnits())) {
          if ((card.getOwnerId() === this.getOwnerId()) && !card.getIsGeneral() && card.getIsBattlePet()) {
            result.push(general.getModifierByClass(PlayerModifierBattlePetManager).triggerBattlePet(card));
            // for minions that "belong to all tribes" - unexhaust them
          } else if ((card.getOwnerId() === this.getOwnerId()) && card.getBelongsToTribe(Races.BattlePet)) {
            const refreshExhaustionAction = new RefreshExhaustionAction(this.getGameSession());
            refreshExhaustionAction.setTarget(card);
            result.push(this.getGameSession().executeAction(refreshExhaustionAction));
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    }
  }
}

module.exports = SpellCrimsonCoil;
