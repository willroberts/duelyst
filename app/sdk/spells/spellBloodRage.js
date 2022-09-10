/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const DamageAction = require('app/sdk/actions/damageAction');
const Modifier = require('app/sdk/modifiers/modifier');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const SpellFilterType = require('./spellFilterType');
const SpellApplyModifiers = require('./spellApplyModifiers');

class SpellBloodRage extends SpellApplyModifiers {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    const position = { x, y };
    const entity = board.getCardAtPosition(position, this.targetType);
    let damageCount = 0;

    // calculate number of damage actions this turn
    let actions = [];
    for (const step of Array.from(this.getGameSession().getCurrentTurn().getSteps())) {
      actions = actions.concat(step.getAction().getFlattenedActionTree());
    }
    for (const action of Array.from(actions)) {
      if (action instanceof DamageAction && (action.getTotalDamageAmount() > 0)) {
        damageCount++;
      }
    }

    if (damageCount > 0) {
      const statContextObject = Modifier.createContextObjectWithAttributeBuffs(damageCount, damageCount);
      statContextObject.appliedName = 'Enraged';
      this.setTargetModifiersContextObjects([
        statContextObject,
      ]);

      return super.onApplyEffectToBoardTile(board, x, y, sourceAction); // apply buff
    }
  }
}

module.exports = SpellBloodRage;
