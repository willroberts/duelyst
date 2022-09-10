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
const Cards = require('app/sdk/cards/cardsLookupComplete');
const ModifierTakeDamageWatchSpawnEntity = require('./modifierTakeDamageWatchSpawnEntity');

class ModifierTakeDamageWatchSpawnRandomHaunt extends ModifierTakeDamageWatchSpawnEntity {
  static initClass() {
    this.prototype.type = 'ModifierTakeDamageWatchSpawnRandomHaunt';
    this.type = 'ModifierTakeDamageWatchSpawnRandomHaunt';

    this.description = 'Whenever this minion takes damage, summon a random haunt nearby';

    this.prototype.possibleTokens = [
      { id: Cards.Boss.Boss31Haunt1 },
      { id: Cards.Boss.Boss31Haunt2 },
      { id: Cards.Boss.Boss31Haunt3 },
    ];
  }

  getCardDataOrIndexToSpawn() {
    return this.possibleTokens[this.getGameSession().getRandomIntegerForExecution(this.possibleTokens.length)];
  }
}
ModifierTakeDamageWatchSpawnRandomHaunt.initClass();

module.exports = ModifierTakeDamageWatchSpawnRandomHaunt;
