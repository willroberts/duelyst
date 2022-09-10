/* eslint-disable
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-restricted-syntax,
    no-tabs,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Logger = require('app/common/logger');
const CONFIG = require('app/common/config');
const CardType = require('app/sdk/cards/cardType');
const KillAction = require('app/sdk/actions/killAction');
const Spell = 	require('./spell');
const SpellFilterType = require('./spellFilterType');

class SpellKillRandomTarget extends Spell {
  static initClass() {
    this.prototype.spellFilterType = SpellFilterType.None;
    this.prototype.targetType = CardType.Unit;
    this.prototype.numberToKill = 1;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const applyEffectPosition = { x, y };

    // only execute the damage on reapply
    // we'll find the random positions during reapply
    const entity = board.getCardAtPosition(applyEffectPosition, this.targetType);
    const killAction = new KillAction(this.getGameSession());
    killAction.setOwnerId(this.getOwnerId());
    killAction.setTarget(entity);
    return this.getGameSession().executeAction(killAction);
  }

  _findApplyEffectPositions(position, sourceAction) {
    const randomApplyEffectPositions = [];
    const board = this.getGameSession().getBoard();

    if (sourceAction != null) {
      const applyEffectPositionsBase = super._findApplyEffectPositions(position, sourceAction);
      const applyEffectPositionsWithEntity = [];

      // include position this was cast at
      applyEffectPositionsBase.push(position);

      // pick up to number to kill random positions from reapply positions
      for (const applyEffectPosition of Array.from(applyEffectPositionsBase)) {
        const entity = board.getCardAtPosition(applyEffectPosition, this.targetType);
        if ((entity != null) && (!entity.getIsGeneral() || this.canTargetGeneral) && (this.getTargetsNeutral() || (this.getTargetsAllies() && (entity.getOwnerId() === this.getOwnerId())) || (this.getTargetsEnemies() && (entity.getOwnerId() !== this.getOwnerId())))) {
          applyEffectPositionsWithEntity.push(applyEffectPosition);
        }
      }

      let killCount = 0;
      while (applyEffectPositionsWithEntity.length > 0) {
        const index = this.getGameSession().getRandomIntegerForExecution(applyEffectPositionsWithEntity.length);
        randomApplyEffectPositions.push(applyEffectPositionsWithEntity.splice(index, 1)[0]);
        if (++killCount >= this.numberToKill) { break; }
      }
    }

    return randomApplyEffectPositions;
  }
}
SpellKillRandomTarget.initClass();

module.exports = SpellKillRandomTarget;
