/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('app/common/config');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const PlayCardSilentlyAction = require('app/sdk/actions/playCardSilentlyAction');
const UtilsGameSession = require('../../common/utils/utils_game_session.coffee');
const Spell = require('./spell');

class SpellSummoningStones extends Spell {
  onApplyOneEffectToBoard(board, x, y, sourceAction) {
    super.onApplyOneEffectToBoard(board, x, y, sourceAction);

    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      let cardAtIndex; let cardId; let cardIndex; let
        i;
      const foundIds = [];

      const validCardIds = [
        Cards.Faction3.BrazierRedSand,
        Cards.Faction3.BrazierGoldenFlame,
        Cards.Faction3.BrazierDuskWind,
        Cards.Faction3.SoulburnObelysk,
        Cards.Faction3.LavastormObelysk,
        Cards.Faction3.TrygonObelysk,
        Cards.Faction3.SimulacraObelysk,
      ];

      // Determine which obelysk IDs are in the deck
      const drawPile = this.getOwner().getDeck().getDrawPile();
      for (i = 0; i < drawPile.length; i++) {
        cardIndex = drawPile[i];
        cardAtIndex = this.getGameSession().getCardByIndex(cardIndex);
        if (cardAtIndex != null) {
          cardId = cardAtIndex.getBaseCardId();
          for (const validId of Array.from(validCardIds)) {
            if (validId === cardId) {
              let alreadyFound = false;
              for (const foundId of Array.from(foundIds)) {
                if (cardId === foundId) {
                  alreadyFound = true;
                  break;
                }
              }
              if (!alreadyFound) {
                foundIds.push(validId);
              }
              break;
            }
          }
        }
      }

      // for each obelysk ID, summon a random one from deck
      return (() => {
        const result = [];
        for (const obelyskId of Array.from(foundIds)) {
          const indexesOfObelysk = [];
          for (i = 0; i < drawPile.length; i++) {
            cardIndex = drawPile[i];
            cardAtIndex = this.getGameSession().getCardByIndex(cardIndex);
            if (cardAtIndex != null) {
              cardId = cardAtIndex.getBaseCardId();
              if (obelyskId === cardId) {
                indexesOfObelysk.push(cardIndex);
              }
            }
          }

          const indexToSummon = indexesOfObelysk[this.getGameSession().getRandomIntegerForExecution(indexesOfObelysk.length)];

          if (indexToSummon != null) {
            const card = this.getGameSession().getCardByIndex(indexToSummon);
            const validSpawnLocations = UtilsGameSession.getSmartSpawnPositionsFromPattern(this.getGameSession(), { x: 0, y: 0 }, CONFIG.ALL_BOARD_POSITIONS, card);
            const spawnLocation = validSpawnLocations[this.getGameSession().getRandomIntegerForExecution(validSpawnLocations.length)];

            if (spawnLocation != null) {
              const playCardAction = new PlayCardSilentlyAction(this.getGameSession(), this.getOwnerId(), spawnLocation.x, spawnLocation.y, card);
              playCardAction.setSource(this);
              result.push(this.getGameSession().executeAction(playCardAction));
            } else {
              result.push(undefined);
            }
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    }
  }
}

module.exports = SpellSummoningStones;
