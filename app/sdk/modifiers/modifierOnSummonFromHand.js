/* eslint-disable
    class-methods-use-this,
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
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PlayCardAction = require('app/sdk/actions/playCardAction');
const ApplyModifierAction = require('app/sdk/actions/applyModifierAction');
const Modifier = require('./modifier');

class ModifierOnSummonFromHand extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierOnSummonFromHand';
    this.type = 'ModifierOnSummonFromHand';

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;

    this.prototype.triggered = false;
  }

  onActivate() {
    super.onActivate();

    if (!this.triggered && this.getCard().getIsPlayed()) {
      // always flag self as triggered when card becomes played
      this.triggered = true;
      let executingAction = this.getGameSession().getExecutingAction();

      // account for modifier activated by being applied
      if ((executingAction != null) && executingAction instanceof ApplyModifierAction) {
        const parentAction = executingAction.getParentAction();
        if (parentAction instanceof PlayCardAction) { executingAction = parentAction; }
      }

      if ((executingAction == null) || (executingAction instanceof PlayCardAction && (executingAction.getCard() === this.getCard()))) {
        // only trigger when played PlayCardAction or no action (i.e. during game setup)
        this.getGameSession().p_startBufferingEvents();
        return this.onSummonFromHand();
      }
    }
  }

  getIsActiveForCache() {
    return !this.triggered && super.getIsActiveForCache();
  }

  onSummonFromHand() {}
}
ModifierOnSummonFromHand.initClass();
// override me in sub classes to implement special behavior

module.exports = ModifierOnSummonFromHand;
