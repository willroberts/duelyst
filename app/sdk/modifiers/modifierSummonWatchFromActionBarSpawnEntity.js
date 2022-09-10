/* eslint-disable
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PlayCardFromHandAction = require('app/sdk/actions/playCardFromHandAction');
const CardType = require('app/sdk/cards/cardType');
const ModifierSummonWatchSpawnEntity = require('./modifierSummonWatchSpawnEntity');

class ModifierSummonWatchFromActionBarSpawnEntity extends ModifierSummonWatchSpawnEntity {
  static initClass() {
    this.prototype.type = 'ModifierSummonWatchFromActionBarSpawnEntity';
    this.type = 'ModifierSummonWatchFromActionBarSpawnEntity';

    this.description = 'Whenever you summon a minion from your action bar, summon %X';
  }

  getIsActionRelevant(action) {
    return action instanceof PlayCardFromHandAction && (action.getCard() !== this.getCard()) && super.getIsActionRelevant(action);
  }
}
ModifierSummonWatchFromActionBarSpawnEntity.initClass();
// watch for a unit being summoned from action bar by the player who owns this entity, don't trigger on summon of this unit

module.exports = ModifierSummonWatchFromActionBarSpawnEntity;
