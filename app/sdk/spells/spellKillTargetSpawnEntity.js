/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Logger = require('app/common/logger');
const PlayCardSilentlyAction = require('app/sdk/actions/playCardSilentlyAction');
const SpellKillTarget = require('./spellKillTarget');

class SpellKillTargetSpawnEntity extends SpellKillTarget {
  static initClass() {
    this.prototype.cardDataOrIndexToSpawn = null;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    if (this.cardDataOrIndexToSpawn) {
      const spawnEntityAction = new PlayCardSilentlyAction(this.getGameSession(), this.getOwnerId(), x, y, this.cardDataOrIndexToSpawn);
      return this.getGameSession().executeAction(spawnEntityAction);
    }
  }
}
SpellKillTargetSpawnEntity.initClass();

module.exports = SpellKillTargetSpawnEntity;
