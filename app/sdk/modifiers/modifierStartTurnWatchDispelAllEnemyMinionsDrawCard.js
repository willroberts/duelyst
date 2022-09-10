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
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const UtilsGameSession = require('app/common/utils/utils_game_session');
const Stringifiers = require('app/sdk/helpers/stringifiers');
const CardType = require('app/sdk/cards/cardType');
const CONFIG = require('app/common/config');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const Factions = require('app/sdk/cards/factionsLookup.coffee');
const DrawCardAction = require('app/sdk/actions/drawCardAction');
const _ = require('underscore');
const ModifierSilence = require('./modifierSilence');
const ModifierStartTurnWatch = require('./modifierStartTurnWatch');

class ModifierStartTurnWatchDispelAllEnemyMinionsDrawCard extends ModifierStartTurnWatch {
  static initClass() {
    this.prototype.type = 'ModifierStartTurnWatchDispelAllEnemyMinionsDrawCard';
    this.type = 'ModifierStartTurnWatchDispelAllEnemyMinionsDrawCard';

    this.description = 'At the start of your turn, dispel all enemy minions and draw a card';
  }

  onTurnWatch(action) {
    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      for (const enemyUnit of Array.from(this.getGameSession().getBoard().getEnemyEntitiesForEntity(this.getCard(), CardType.Unit))) {
        if (!enemyUnit.getIsGeneral()) {
          this.getGameSession().applyModifierContextObject(ModifierSilence.createContextObject(), enemyUnit);
        }
      }
      const a = new DrawCardAction(this.getGameSession(), this.getCard().getOwnerId());
      return this.getGameSession().executeAction(a);
    }
  }
}
ModifierStartTurnWatchDispelAllEnemyMinionsDrawCard.initClass();

module.exports = ModifierStartTurnWatchDispelAllEnemyMinionsDrawCard;
