/* eslint-disable
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
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const ModifierEnemySpellWatch = require('./modifierEnemySpellWatch');

class ModifierEnemySpellWatchPutCardInHand extends ModifierEnemySpellWatch {
  static initClass() {
    this.prototype.type = 'ModifierEnemySpellWatchPutCardInHand';
    this.type = 'ModifierEnemySpellWatchPutCardInHand';

    this.modifierName = 'Enemy Spell Watch Put Card In Hand';
    this.description = 'Whenever the opponent casts a spell, put an X in your action bar';

    this.prototype.fxResource = ['FX.Modifiers.ModifierSpellWatch'];
  }

  static createContextObject(cardDataOrIndexToPutInHand, options) {
    const contextObject = super.createContextObject(options);
    contextObject.cardDataOrIndexToPutInHand = cardDataOrIndexToPutInHand;
    return contextObject;
  }

  onEnemySpellWatch(action) {
    const a = new PutCardInHandAction(this.getGameSession(), this.getCard().getOwnerId(), this.cardDataOrIndexToPutInHand);
    return this.getGameSession().executeAction(a);
  }
}
ModifierEnemySpellWatchPutCardInHand.initClass();

module.exports = ModifierEnemySpellWatchPutCardInHand;
