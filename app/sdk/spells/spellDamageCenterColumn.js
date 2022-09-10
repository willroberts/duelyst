/* eslint-disable
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('app/common/config');
const UtilsGameSession = require('app/common/utils/utils_game_session');
const SpellDamage = require('./spellDamage');

class SpellDamageCenterColumn extends SpellDamage {
  _findApplyEffectPositions(position, sourceAction) {
    const board = this.getGameSession().getBoard();
    const centerPosition = { x: 4, y: 2 };
    const applyEffectPositions = [];
    const validDamageLocations = UtilsGameSession.getValidBoardPositionsFromPattern(board, centerPosition, CONFIG.PATTERN_WHOLE_COLUMN, true);
    if ((validDamageLocations != null ? validDamageLocations.length : undefined) > 0) {
      for (let i = 0, end = validDamageLocations.length, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
        const location = validDamageLocations[i];
        const unit = board.getUnitAtPosition(location);
        if (unit != null) {
          applyEffectPositions.push(location);
        }
      }
    }

    return applyEffectPositions;
  }
}

module.exports = SpellDamageCenterColumn;
