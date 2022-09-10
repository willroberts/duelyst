/* eslint-disable
    import/no-unresolved,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const DrawCardAction = require('app/sdk/actions/drawCardAction');
const SpellDamage = require('./spellDamage');
const SpellFilterType = require('./spellFilterType');

class SpellDamageEnemyGeneralBothDrawCard extends SpellDamage {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.None;
  }

  _findApplyEffectPositions(position, sourceAction) {
    const applyEffectPositions = [];

    // can only target enemy general
    const general = this.getGameSession().getGeneralForOpponentOfPlayerId(this.getOwnerId());
    if (general != null) {
      // apply spell on enemy General
      applyEffectPositions.push(general.getPosition());
    }

    return applyEffectPositions;
  }

  onApplyOneEffectToBoard(board, x, y, sourceAction) {
    // enemy draws a card
    const deck = this.getGameSession().getOpponentPlayerOfPlayerId(this.getOwnerId()).getDeck();
    this.getGameSession().executeAction(deck.actionDrawCard());

    // caster draws a card
    return this.getGameSession().executeAction(this.getOwner().getDeck().actionDrawCard());
  }
}
SpellDamageEnemyGeneralBothDrawCard.initClass();

module.exports = SpellDamageEnemyGeneralBothDrawCard;
