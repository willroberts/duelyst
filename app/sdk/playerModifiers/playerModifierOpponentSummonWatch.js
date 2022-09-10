/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PlayerModifier = require('./playerModifier');
const CardType = require('app/sdk/cards/cardType');
const ApplyCardToBoardAction = require('app/sdk/actions/applyCardToBoardAction');
const PlayCardAsTransformAction = require('app/sdk/actions/playCardAsTransformAction');
const CloneEntityAsTransformAction = require('app/sdk/actions/cloneEntityAsTransformAction');

class PlayerModifierOpponentSummonWatch extends PlayerModifier {
	static initClass() {
	
		this.prototype.type ="PlayerModifierOpponentSummonWatch";
		this.type ="PlayerModifierOpponentSummonWatch";
	}

	onAction(e) {
		super.onAction(e);

		const {
            action
        } = e;

		// watch for a unit being summoned in any way by the player who owns this entity
		if (action instanceof ApplyCardToBoardAction && (action.getOwnerId() !== this.getCard().getOwnerId()) && (__guard__(action.getCard(), x => x.type) === CardType.Unit) && (action.getCard() !== this.getCard()) && (action.getCard() !== this.getSourceCard())) {
			// don't react to transforms
			if (!(action instanceof PlayCardAsTransformAction || action instanceof CloneEntityAsTransformAction)) {
				return this.onSummonWatch(action);
			}
		}
	}

	onSummonWatch(action) {}
}
PlayerModifierOpponentSummonWatch.initClass();
		// override me in sub classes to implement special behavior

module.exports = PlayerModifierOpponentSummonWatch;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}