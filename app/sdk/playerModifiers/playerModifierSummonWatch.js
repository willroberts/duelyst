/* eslint-disable
    class-methods-use-this,
    consistent-return,
    import/no-unresolved,
    max-len,
    no-underscore-dangle,
    no-use-before-define,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const ApplyCardToBoardAction = require('app/sdk/actions/applyCardToBoardAction');
const PlayCardAsTransformAction = require('app/sdk/actions/playCardAsTransformAction');
const CloneEntityAsTransformAction = require('app/sdk/actions/cloneEntityAsTransformAction');
const PlayerModifier = require('./playerModifier');

class PlayerModifierSummonWatch extends PlayerModifier {
  static initClass() {
    this.prototype.type = 'PlayerModifierSummonWatch';
    this.type = 'PlayerModifierSummonWatch';
  }

  onAction(e) {
    super.onAction(e);

    const {
      action,
    } = e;

    if (this.getIsActionRelevant(action)) {
      return this.onSummonWatch(action);
    }
  }

  getIsActionRelevant(action) {
    // watch for a unit being summoned in any way by the player who owns this entity
    if (action instanceof ApplyCardToBoardAction && (action.getOwnerId() === this.getCard().getOwnerId()) && (__guard__(action.getCard(), (x) => x.type) === CardType.Unit) && (action.getCard() !== this.getCard()) && (action.getCard() !== this.getSourceCard())) {
      // don't react to transforms
      if (!(action instanceof PlayCardAsTransformAction || action instanceof CloneEntityAsTransformAction)) {
        return true;
      }
    }
    return false;
  }

  onSummonWatch(action) {}
}
PlayerModifierSummonWatch.initClass();
// override me in sub classes to implement special behavior

module.exports = PlayerModifierSummonWatch;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
