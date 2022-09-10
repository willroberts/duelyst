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
const CONFIG = require('app/common/config');
const UtilsGameSession = require('app/common/utils/utils_game_session');
const CardType = require('app/sdk/cards/cardType');
const PlayCardSilentlyAction = require('app/sdk/actions/playCardSilentlyAction');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const Factions = require('app/sdk/cards/factionsLookup');
const Modifier = require('./modifier');
const ModifierOpeningGambit = require('./modifierOpeningGambit');

class ModifierOpeningGambitSpawnVanarTokensAroundGeneral extends ModifierOpeningGambit {
  static initClass() {
    this.prototype.type = 'ModifierOpeningGambitSpawnVanarTokensAroundGeneral';
    this.type = 'ModifierOpeningGambitSpawnVanarTokensAroundGeneral';

    this.description = 'Surround the enemy General with random Walls';

    this.prototype.cardDataOrIndexToSpawn = null;

    this.prototype.fxResource = ['FX.Modifiers.ModifierSpellWatch', 'FX.Modifiers.ModifierGenericSpawn'];
  }

  onOpeningGambit(action) {
    super.onOpeningGambit(action);

    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      const spawnLocations = UtilsGameSession.getRandomSmartSpawnPositionsFromPattern(this.getGameSession(), this.getGameSession().getGeneralForOpponentOfPlayerId(this.getCard().getOwnerId()).getPosition(), CONFIG.PATTERN_3x3, this.getCard(), this.getCard(), 8);

      return (() => {
        const result = [];
        for (const position of Array.from(spawnLocations)) {
          const possibleTokens = [
            { id: Cards.Faction6.BlazingSpines },
            { id: Cards.Faction6.BonechillBarrier },
            { id: Cards.Faction6.GravityWell },
            { id: Cards.Faction6.FrostBomb },
          ];
          const card = this.getGameSession().getExistingCardFromIndexOrCreateCardFromData(possibleTokens[this.getGameSession().getRandomIntegerForExecution(possibleTokens.length)]);
          const playCardAction = new PlayCardSilentlyAction(this.getGameSession(), this.getCard().getOwnerId(), position.x, position.y, card.createNewCardData());
          playCardAction.setSource(this.getCard());
          result.push(this.getGameSession().executeAction(playCardAction));
        }
        return result;
      })();
    }
  }
}
ModifierOpeningGambitSpawnVanarTokensAroundGeneral.initClass();

module.exports = ModifierOpeningGambitSpawnVanarTokensAroundGeneral;
