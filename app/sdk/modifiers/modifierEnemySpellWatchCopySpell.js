/* eslint-disable
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
const PutCardInHandAction = require('app/sdk/actions/putCardInHandAction');
const ModifierEnemySpellWatch = require('./modifierEnemySpellWatch');

class ModifierEnemySpellWatchCopySpell extends ModifierEnemySpellWatch {
  static initClass() {
    this.prototype.type = 'ModifierEnemySpellWatchCopySpell';
    this.type = 'ModifierEnemySpellWatchCopySpell';

    this.modifierName = 'Enemy Spell Watch Copy Spell';
    this.description = 'Whenever the opponent casts a spell, gain of copy of the spell';

    this.prototype.fxResource = ['FX.Modifiers.ModifierSpellWatch'];
  }

  onEnemySpellWatch(action) {
    const spell = action.getTarget();
    if (spell != null) {
      const putCardInHandAction = new PutCardInHandAction(this.getGameSession(), this.getCard().getOwnerId(), spell.createNewCardData());
      return this.getGameSession().executeAction(putCardInHandAction);
    }
  }
}
ModifierEnemySpellWatchCopySpell.initClass();

module.exports = ModifierEnemySpellWatchCopySpell;
