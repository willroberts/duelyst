/* eslint-disable
    class-methods-use-this,
    consistent-return,
    import/no-unresolved,
    max-len,
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
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Logger = require('app/common/logger');
const CONFIG = require('app/common/config');
const CardType = require('app/sdk/cards/cardType');
const DamageAction = require('app/sdk/actions/damageAction');
const UtilsGameSession = require('app/common/utils/utils_game_session');
const SpellFilterType = require('./spellFilterType');
const Spell = 	require('./spell');

class SpellBoneSwarm extends Spell {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.EnemyIndirect;
    this.prototype.damageAmount = 0;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const applyEffectPosition = { x, y };
    const general = board.getCardAtPosition(applyEffectPosition, this.targetType);

    if ((general != null) && general.getIsGeneral()) {
      // damage enemy general
      let damageAction = new DamageAction(this.getGameSession());
      damageAction.setOwnerId(this.getOwnerId());
      damageAction.setTarget(general);
      damageAction.setDamageAmount(this.damageAmount);
      this.getGameSession().executeAction(damageAction);

      // damage all enemy nearby minions around General (friendly to the General you are targeting)
      return (() => {
        const result = [];
        for (const entity of Array.from(board.getFriendlyEntitiesAroundEntity(general, CardType.Unit, 1))) {
          damageAction = new DamageAction(this.getGameSession());
          damageAction.setOwnerId(this.ownerId);
          damageAction.setTarget(entity);
          damageAction.setDamageAmount(this.damageAmount);
          result.push(this.getGameSession().executeAction(damageAction));
        }
        return result;
      })();
    }
  }

  _findApplyEffectPositions(position, sourceAction) {
    const applyEffectPositions = [];

    // only affects enemy General
    const enemyGeneral = this.getGameSession().getGeneralForOpponentOfPlayerId(this.getOwnerId());
    if (enemyGeneral != null) { applyEffectPositions.push(enemyGeneral.getPosition()); }

    return applyEffectPositions;
  }

  getAppliesSameEffectToMultipleTargets() {
    return true;
  }
}
SpellBoneSwarm.initClass();

module.exports = SpellBoneSwarm;
