/* eslint-disable
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
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const AttackAction = require('app/sdk/actions/attackAction');
const SpellDamage = require('./spellDamage');

class SpellSpiralCounter extends SpellDamage {
  static initClass() {
    this.prototype.damageAmount = 8;
  }

  // can only target enemy minions that attacked last turn
  _filterPlayPositions(spellPositions) {
    const finalPositions = [];

    const turns = this.getGameSession().getTurns();
    if (turns.length > 1) {
      const lastTurn = turns[turns.length - 1];
      let actions = [];
      const possibleTargets = [];

      for (const step of Array.from(lastTurn.getSteps())) {
        actions = actions.concat(step.getAction().getFlattenedActionTree());
      }

      // find enemy minions that attacked last turn
      for (const action of Array.from(actions)) {
        if (action.type === AttackAction.type) {
          const attacker = action.getSource();
          if ((attacker.getType() === CardType.Unit) && !(attacker.getOwnerId() === this.getOwnerId()) && !attacker.getIsGeneral()) {
            possibleTargets.push(attacker);
          }
        }
      }

      for (const target of Array.from(possibleTargets)) {
        if (target.getIsLocatedOnBoard()) {
          finalPositions.push(target.getPosition());
        }
      }
    }

    return finalPositions;
  }
}
SpellSpiralCounter.initClass();

module.exports = SpellSpiralCounter;
