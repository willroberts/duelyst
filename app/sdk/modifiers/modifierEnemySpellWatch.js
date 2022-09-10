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
const PlayCardFromHandAction = require('app/sdk/actions/playCardFromHandAction');
const PlaySignatureCardAction = require('app/sdk/actions/playSignatureCardAction');
const CardType = require('app/sdk/cards/cardType');
const Modifier = require('./modifier');

class ModifierEnemySpellWatch extends Modifier {
  static initClass() {
    this.prototype.type = 'ModifierEnemySpellWatch';
    this.type = 'ModifierEnemySpellWatch';

    this.modifierName = 'Enemy Spell Watch';
    this.description = 'Enemy Spell Watch';

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;

    this.prototype.fxResource = ['FX.Modifiers.ModifierSpellWatch'];
  }

  onBeforeAction(e) {
    super.onBeforeAction(e);

    const {
      action,
    } = e;

    // watch for a spell (but not a followup) being cast by player who owns this entity
    if ((action instanceof PlayCardFromHandAction || action instanceof PlaySignatureCardAction) && (action.getOwnerId() !== this.getCard().getOwnerId()) && (__guard__(action.getCard(), (x) => x.type) === CardType.Spell)) {
      return this.onEnemySpellWatch(action);
    }
  }

  onEnemySpellWatch(action) {}
}
ModifierEnemySpellWatch.initClass();
// override me in sub classes to implement special behavior

module.exports = ModifierEnemySpellWatch;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
