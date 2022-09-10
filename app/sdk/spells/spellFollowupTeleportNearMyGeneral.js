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
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const UtilsGameSession = require('app/common/utils/utils_game_session');
const CONFIG = require('app/common/config');
const _ = require('underscore');
const SpellFollowupTeleport = require('./spellFollowupTeleport');

class SpellFollowupTeleportNearMyGeneral extends SpellFollowupTeleport {
  _postFilterPlayPositions(spellPositions) {
    // make sure that there is something to teleport at the source position
    if (this.getTeleportSource(this.getApplyEffectPosition()) != null) {
      const validPositions = [];

      const general = this.getGameSession().getGeneralForPlayerId(this.getOwnerId());
      if (general != null) {
        const teleportLocations = UtilsGameSession.getValidBoardPositionsFromPattern(this.getGameSession().getBoard(), general.getPosition(), CONFIG.PATTERN_3x3, false);
        for (const position of Array.from(teleportLocations)) {
          validPositions.push(position);
        }
      }

      return validPositions;
    }
    return [];
  }
}

module.exports = SpellFollowupTeleportNearMyGeneral;
