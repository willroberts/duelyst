/* eslint-disable
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
const Spell = require('./spell');

class SpellJuxtaposition extends Spell {
  _postFilterPlayPositions(validPositions) {
    // there must be at least 2 minions on the board to play juxtaposition
    if (validPositions.length < 2) {
      return [];
    }
    return super._postFilterPlayPositions(validPositions);
  }
}

module.exports = SpellJuxtaposition;
