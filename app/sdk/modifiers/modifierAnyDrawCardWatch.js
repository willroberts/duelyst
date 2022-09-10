/* eslint-disable
    class-methods-use-this,
    consistent-return,
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
const DrawCardAction = require('app/sdk/actions/drawCardAction');
const BurnCardAction = require('app/sdk/actions/burnCardAction');
const Modifier = require('./modifier');

class ModifierAnyDrawCardWatch extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierAnyDrawCardWatch';
    this.type = 'ModifierAnyDrawCardWatch';

    this.modifierName = 'AnyDrawCardWatch';
    this.description = 'Whenever any player draws a card ...';

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;

    this.prototype.fxResource = ['FX.Modifiers.ModifierAnyDrawCardWatch'];
  }

  onAction(e) {
    super.onAction(e);

    const {
      action,
    } = e;

    // watch for my player drawing a card
    if (action instanceof DrawCardAction && !(action instanceof BurnCardAction)) {
      return this.onDrawCardWatch(action);
    }
  }

  onDrawCardWatch(action) {}
}
ModifierAnyDrawCardWatch.initClass();
// override me in sub classes to implement special behavior

module.exports = ModifierAnyDrawCardWatch;
