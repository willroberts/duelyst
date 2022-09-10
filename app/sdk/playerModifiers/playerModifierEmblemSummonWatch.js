/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PlayerModifierEmblem = require('./playerModifierEmblem');
const CardType = require('app/sdk/cards/cardType');
const ApplyCardToBoardAction = require('app/sdk/actions/applyCardToBoardAction');
const PlayCardAsTransformAction = require('app/sdk/actions/playCardAsTransformAction');
const CloneEntityAsTransformAction = require('app/sdk/actions/cloneEntityAsTransformAction');

class PlayerModifierEmblemSummonWatch extends PlayerModifierEmblem {
	static initClass() {
	
		this.prototype.type ="PlayerModifierEmblemSummonWatch";
		this.type ="PlayerModifierEmblemSummonWatch";
	}

	onAction(e) {
		super.onAction(e);

		const {
            action
        } = e;

		if (this.getIsActionRelevant(action)) {
			return this.onSummonWatch(action);
		}
	}

	getIsActionRelevant(action) {
		// watch for a unit being summoned in any way by the player who owns this entity
		if (action instanceof ApplyCardToBoardAction && (action.getOwnerId() === this.getCard().getOwnerId()) && (__guard__(action.getCard(), x => x.type) === CardType.Unit) && !(action instanceof PlayCardAsTransformAction || action instanceof CloneEntityAsTransformAction)) {
			return true;
		}
		return false;
	}

	onSummonWatch(action) {}
}
PlayerModifierEmblemSummonWatch.initClass();
		// override me in sub classes to implement special behavior

module.exports = PlayerModifierEmblemSummonWatch;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}