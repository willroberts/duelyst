/* eslint-disable
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
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const KillAction = require('app/sdk/actions/killAction');
const ModifierStartTurnWatch = require('./modifierStartTurnWatch');

class ModifierStartTurnWatchDestroySelfAndEnemies extends ModifierStartTurnWatch {
  static initClass() {
    this.prototype.type = 'ModifierStartTurnWatchDestroySelfAndEnemies';
    this.type = 'ModifierStartTurnWatchDestroySelfAndEnemies';

    this.description = 'At the start of your turn, destroy this minion and all enemy minions';
  }

  onTurnWatch(action) {
    let killAction;
    for (const enemyUnit of Array.from(this.getGameSession().getBoard().getEnemyEntitiesForEntity(this.getCard(), CardType.Unit))) {
      if (!enemyUnit.getIsGeneral()) {
        killAction = new KillAction(this.getGameSession());
        killAction.setOwnerId(this.getCard().getOwnerId());
        killAction.setSource(this.getCard());
        killAction.setTarget(enemyUnit);
        this.getGameSession().executeAction(killAction);
      }
    }

    killAction = new KillAction(this.getGameSession());
    killAction.setOwnerId(this.getCard().getOwnerId());
    killAction.setSource(this.getCard());
    killAction.setTarget(this.getCard());
    return this.getGameSession().executeAction(killAction);
  }
}
ModifierStartTurnWatchDestroySelfAndEnemies.initClass();

module.exports = ModifierStartTurnWatchDestroySelfAndEnemies;
