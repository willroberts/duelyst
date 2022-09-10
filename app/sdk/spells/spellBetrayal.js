/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const ForcedAttackAction = require('app/sdk/actions/forcedAttackAction');
const Spell = require('./spell');

class SpellBetrayal extends Spell {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    const enemyGeneral = this.getGameSession().getGeneralForOpponentOfPlayerId(this.getOwnerId());
    const minions = board.getFriendlyEntitiesAroundEntity(enemyGeneral, CardType.Unit, 1, true, false);

    if (minions != null) {
      return (() => {
        const result = [];
        for (const minion of Array.from(minions)) {
          if (minion.getATK() > 0) {
            const a = this.getGameSession().createActionForType(ForcedAttackAction.type);
            a.setSource(minion);
            a.setTarget(enemyGeneral);
            a.setOwnerId(this.getOwnerId());
            result.push(this.getGameSession().executeAction(a));
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    }
  }
}

module.exports = SpellBetrayal;
