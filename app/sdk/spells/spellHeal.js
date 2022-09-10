/* eslint-disable
    import/no-unresolved,
    max-len,
    no-tabs,
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
const CardType = require('app/sdk/cards/cardType');
const HealAction = require('app/sdk/actions/healAction');
const Spell = 	require('./spell');
const SpellFilterType = require('./spellFilterType');

class SpellHeal extends Spell {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.AllyDirect;
    this.prototype.healModifier = 0;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const applyEffectPosition = { x, y };
    const entity = board.getCardAtPosition(applyEffectPosition, this.targetType);
    // Logger.module("SDK").debug "[G:#{@.getGameSession().gameId}]", "SpellHeal::onApplyEffectToBoardTile -> healing #{entity.getLogName()} by #{@healModifier}"

    const healAction = new HealAction(this.getGameSession());
    healAction.manaCost = 0;
    healAction.setOwnerId(this.ownerId);
    healAction.setTarget(entity);
    healAction.setHealAmount(this.healModifier);

    return this.getGameSession().executeAction(healAction);
  }
}
SpellHeal.initClass();

module.exports = SpellHeal;
