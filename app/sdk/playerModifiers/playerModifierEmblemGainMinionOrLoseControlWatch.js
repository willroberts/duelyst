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
const CardType = require('app/sdk/cards/cardType');
const ApplyCardToBoardAction = require('app/sdk/actions/applyCardToBoardAction');
const PlayCardAsTransformAction = require('app/sdk/actions/playCardAsTransformAction');
const CloneEntityAsTransformAction = require('app/sdk/actions/cloneEntityAsTransformAction');
const SwapUnitAllegianceAction = require('app/sdk/actions/swapUnitAllegianceAction');
const RemoveAction = require('app/sdk/actions/removeAction');
const PlayerModifierEmblem = require('./playerModifierEmblem');

class PlayerModifierEmblemGainMinionOrLoseControlWatch extends PlayerModifierEmblem {
  static initClass() {
    this.prototype.type = 'PlayerModifierEmblemGainMinionOrLoseControlWatch';
    this.type = 'PlayerModifierEmblemGainMinionOrLoseControlWatch';
  }

  onAction(e) {
    super.onAction(e);

    const {
      action,
    } = e;

    if (this.getIsActionRelevantForGainMinion(action)) {
      return this.onGainMinionWatch(action);
    } if (this.getIsActionRelevantForLoseControl(action)) {
      return this.onLoseControlWatch(action);
    }
  }

  getIsActionRelevantForGainMinion(action) {
    if (action != null) {
      const target = action.getTarget();
      if (target != null) {
        if ((target.type === CardType.Unit) && ((action instanceof ApplyCardToBoardAction && (action.getOwnerId() === this.getCard().getOwnerId())) || (action instanceof SwapUnitAllegianceAction && (target.getOwnerId() === this.getCard().getOwnerId())))) {
          return true;
        }
      }
    }
    return false;
  }

  getIsActionRelevantForLoseControl(action) {
    if (action != null) {
      const target = action.getTarget();
      if (target != null) {
        if ((target.type === CardType.Unit) && action instanceof SwapUnitAllegianceAction && (target.getOwnerId() !== this.getCard().getOwnerId())) {
          return true;
        }
      }
    }
    return false;
  }

  onLoseControlWatch(action) {}
  // override me in sub classes to implement special behavior

  onGainMinionWatch(action) {}
}
PlayerModifierEmblemGainMinionOrLoseControlWatch.initClass();
// override me in sub classes to implement special behavior

module.exports = PlayerModifierEmblemGainMinionOrLoseControlWatch;
