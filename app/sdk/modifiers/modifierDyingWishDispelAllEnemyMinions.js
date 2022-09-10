/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const Modifier = require('./modifier');
const ModifierDyingWish = require('./modifierDyingWish');
const ModifierSilence = require('./modifierSilence');

class ModifierDyingWishDispelAllEnemyMinions extends ModifierDyingWish {
  static initClass() {
    this.prototype.type = 'ModifierDyingWishDispelAllEnemies';
    this.type = 'ModifierDyingWishDispelAllEnemies';

    this.description = 'Dispel all enemy minions';

    this.prototype.fxResource = ['FX.Modifiers.ModifierDyingWish', 'FX.Modifiers.ModifierGenericBuff'];
  }

  onDyingWish(action) {
    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      return (() => {
        const result = [];
        for (const enemyUnit of Array.from(this.getGameSession().getBoard().getEnemyEntitiesForEntity(this.getCard(), CardType.Unit))) {
          if (!enemyUnit.getIsGeneral()) {
            result.push(this.getGameSession().applyModifierContextObject(ModifierSilence.createContextObject(), enemyUnit));
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    }
  }
}
ModifierDyingWishDispelAllEnemyMinions.initClass();

module.exports = ModifierDyingWishDispelAllEnemyMinions;
