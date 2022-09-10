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
const CardType = require('app/sdk/cards/cardType');
const ModifierDealDamageWatch = require('./modifierDealDamageWatch');

class ModifierDealDamageWatchRefreshSignatureCard extends ModifierDealDamageWatch {
  static initClass() {
    this.prototype.type = 'ModifierDealDamageWatchRefreshSignatureCard';
    this.type = 'ModifierDealDamageWatchRefreshSignatureCard';

    this.modifierName = 'Deal Damage and refresh BBS';
    this.description = 'When this minion deals damage, refresh your Bloodbound Spell';
  }

  onDealDamage(action) {
    return this.getGameSession().executeAction(this.getOwner().actionActivateSignatureCard());
  }
}
ModifierDealDamageWatchRefreshSignatureCard.initClass();

module.exports = ModifierDealDamageWatchRefreshSignatureCard;
