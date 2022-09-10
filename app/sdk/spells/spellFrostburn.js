/* eslint-disable
    import/no-unresolved,
    no-restricted-syntax,
    no-underscore-dangle,
    no-use-before-define,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Races = require('app/sdk/cards/racesLookup');
const SpellDamage = require('./spellDamage');

class SpellFrostburn extends SpellDamage {
  _postFilterApplyPositions(originalPositions) {
    const filteredPositions = [];
    for (const position of Array.from(originalPositions)) {
      if (!__guardMethod__(this.getGameSession().getBoard().getUnitAtPosition(position), 'getBelongsToTribe', (o) => o.getBelongsToTribe(Races.Vespyr))) {
        filteredPositions.push(position);
      }
    }

    return filteredPositions;
  }
}

module.exports = SpellFrostburn;

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  }
  return undefined;
}
