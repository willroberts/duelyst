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
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Cards = require('app/sdk/cards/cardsLookupComplete');
const SpellDamage = require('./spellDamage');

class SpellFlamingStampede extends SpellDamage {
  _postFilterApplyPositions(originalPositions) {
    const filteredPositions = [];
    for (const position of Array.from(originalPositions)) {
      if (this.getGameSession().getBoard().getUnitAtPosition(position).getBaseCardId() !== Cards.Faction5.Egg) {
        filteredPositions.push(position);
      }
    }

    return filteredPositions;
  }
}

module.exports = SpellFlamingStampede;
