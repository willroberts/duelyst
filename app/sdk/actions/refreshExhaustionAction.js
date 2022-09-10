/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Action = require('./action');
const CardType = 			require('app/sdk/cards/cardType');

class RefreshExhaustionAction extends Action {
	static initClass() {
	
		this.type ="RefreshExhaustionAction";
	}

	constructor() {
		if (this.type == null) { this.type = RefreshExhaustionAction.type; }
		super(...arguments);
	}

	_execute() {
		super._execute();
		const target = this.getTarget();
		if (target != null) {
			return target.refreshExhaustion();
		}
	}
}
RefreshExhaustionAction.initClass();

module.exports = RefreshExhaustionAction;
