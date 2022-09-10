/* eslint-disable
    class-methods-use-this,
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const SpellApplyModifiers = require('./spellApplyModifiers');

class SpellApplyModifiersToGeneralAndNearbyAllies extends SpellApplyModifiers {
  _findApplyEffectPositions(position, sourceAction) {
    const applyEffectPositions = [];
    const board = this.getGameSession().getBoard();

    const myGeneral = this.getGameSession().getGeneralForPlayerId(this.getOwnerId());
    if (myGeneral != null) {
      applyEffectPositions.push(myGeneral.getPosition());
      for (const entity of Array.from(board.getFriendlyEntitiesAroundEntity(myGeneral, CardType.Unit, 1))) {
        if (entity != null) {
          applyEffectPositions.push(entity.getPosition());
        }
      }
    }

    return applyEffectPositions;
  }

  getAppliesSameEffectToMultipleTargets() {
    return true;
  }
}

module.exports = SpellApplyModifiersToGeneralAndNearbyAllies;
