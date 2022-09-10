/* eslint-disable
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const SwapUnitAllegianceAction = require('app/sdk/actions/swapUnitAllegianceAction');
const ModifierEndTurnWatch = require('./modifierEndTurnWatch');

class ModifierEndTurnWatchSwapAllegiance extends ModifierEndTurnWatch {
  static initClass() {
    this.prototype.type = 'ModifierEndTurnWatchSwapAllegiance';
    this.type = 'ModifierEndTurnWatchSwapAllegiance';

    this.modifierName = 'Turn Watch';
    this.description = 'At the end of your turn, swap owner';

    this.prototype.isHiddenToUI = true; // don't show this modifier by default

    this.prototype.fxResource = ['FX.Modifiers.ModifierEndTurnWatch'];
  }

  onTurnWatch(action) {
    super.onTurnWatch(action);

    const a = new SwapUnitAllegianceAction(this.getCard().getGameSession());
    a.setTarget(this.getCard());
    return this.getGameSession().executeAction(a);
  }
}
ModifierEndTurnWatchSwapAllegiance.initClass();

module.exports = ModifierEndTurnWatchSwapAllegiance;
