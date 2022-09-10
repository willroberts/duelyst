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
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const DrawCardAction = require('app/sdk/actions/drawCardAction');
const BurnCardAction = require('app/sdk/actions/burnCardAction');
const Modifier = require('./modifier');

class ModifierOpponentDrawCardWatch extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierOpponentDrawCardWatch';
    this.type = 'ModifierOpponentDrawCardWatch';

    this.modifierName = 'ModifierOpponentDrawCardWatch';
    this.description = 'Whenever your opponent draws a card ...';

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;

    this.prototype.fxResource = ['FX.Modifiers.ModifierOpponentDrawCardWatch'];
  }

  onAction(e) {
    super.onAction(e);

    const {
      action,
    } = e;

    // watch for opponent player drawing a card
    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      if (action instanceof DrawCardAction && !(action instanceof BurnCardAction) && (action.getOwnerId() !== this.getCard().getOwnerId())) {
        return this.onDrawCardWatch(action);
      }
    }
  }

  onDrawCardWatch(action) {}
}
ModifierOpponentDrawCardWatch.initClass();
// override me in sub classes to implement special behavior

module.exports = ModifierOpponentDrawCardWatch;
