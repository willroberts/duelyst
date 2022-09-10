/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Modifier = require('./modifier');
const CardType = require('app/sdk/cards/cardType');
const EndTurnAction = require('app/sdk/actions/endTurnAction');
const Stringifiers = require('app/sdk/helpers/stringifiers');

class ModifierEndTurnWatch extends Modifier {
	static initClass() {
	
		this.prototype.type ="ModifierEndTurnWatch";
		this.type ="ModifierEndTurnWatch";
	
		this.modifierName ="End Turn Watch";
		this.description = "End Turn Watch";
	
		this.prototype.activeInHand = false;
		this.prototype.activeInDeck = false;
		this.prototype.activeInSignatureCards = false;
		this.prototype.activeOnBoard = true;
	
		this.prototype.fxResource = ["FX.Modifiers.ModifierEndTurnWatch"];
	}

	onActivate() {
		super.onActivate();

		// trigger when applied during end of turn
		// but only if this was not applied as a result of the card being played
		if (this.getGameSession().getCurrentTurn().getEnded()) {
			const executingAction = this.getGameSession().getExecutingAction();
			const endTurnAction = executingAction.getMatchingAncestorAction(EndTurnAction);
			if (endTurnAction != null) {
				const playedByAction = this.getCard().getAppliedToBoardByAction();
				if ((playedByAction == null)) {
					return this.onTurnWatch(endTurnAction);
				} else if (playedByAction.getIndex() < endTurnAction.getIndex()) {
					return this.onTurnWatch(executingAction);
				}
			}
		}
	}

	onEndTurn(e) {
		super.onEndTurn(e);

		if (this.getGameSession().getCurrentPlayer().getPlayerId() === this.getCard().getOwnerId()) {
			return this.onTurnWatch(this.getGameSession().getExecutingAction());
		}
	}

	onTurnWatch(action) {}
}
ModifierEndTurnWatch.initClass();
		// override me in sub classes to implement special behavior

module.exports = ModifierEndTurnWatch;
