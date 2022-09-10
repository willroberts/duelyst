/* eslint-disable
    import/no-unresolved,
    max-len,
    no-tabs,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
const CONFIG = require('../../common/config');
const SpellCloneSourceEntity = 	require('./spellCloneSourceEntity');
const UtilsGameSession = require('../../common/utils/utils_game_session.coffee');

/*
  Spawns a new entity nearby my general as clone of another entity.
*/
class SpellCloneSourceEntityNearbyGeneral extends SpellCloneSourceEntity {
  _getPrefilteredValidTargetPositions() {
    // get positions around General
    return UtilsGameSession.getValidBoardPositionsFromPattern(this.getGameSession().getBoard(), this.getGameSession().getGeneralForPlayerId(this.ownerId).getPosition(), CONFIG.PATTERN_3x3);
  }
}

module.exports = SpellCloneSourceEntityNearbyGeneral;
