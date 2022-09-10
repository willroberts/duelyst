/* eslint-disable
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PlayCardFromHandAction = require('app/sdk/actions/playCardFromHandAction');
const PlayerModifierSummonWatch = require('./playerModifierSummonWatch');

class PlayerModifierSummonWatchFromActionBar extends PlayerModifierSummonWatch {
  static initClass() {
    this.prototype.type = 'PlayerModifierSummonWatchFromActionBar';
    this.type = 'PlayerModifierSummonWatchFromActionBar';
  }

  getIsActionRelevant(action) {
    return action instanceof PlayCardFromHandAction && super.getIsActionRelevant(action);
  }
}
PlayerModifierSummonWatchFromActionBar.initClass();
// watch for a unit being summoned from action bar by the player who owns this entity

module.exports = PlayerModifierSummonWatchFromActionBar;
