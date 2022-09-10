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
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('app/common/config');
const ModifierTransformed = require('app/sdk/modifiers/modifierTransformed');
const RemoveAction = require('app/sdk/actions/removeAction');
const PlayCardAsTransformAction = require('app/sdk/actions/playCardAsTransformAction');
const CardType = require('app/sdk/cards/cardType');
const Cards = require('app/sdk/cards/cardsLookupComplete');
const GameFormat = require('app/sdk/gameFormat');
const _ = require('underscore');
const PlayerModifierEmblemEndTurnWatch = require('./playerModifierEmblemEndTurnWatch');

class PlayerModifierEmblemEndTurnWatchLyonarSmallMinionQuest extends PlayerModifierEmblemEndTurnWatch {
  static initClass() {
    this.prototype.type = 'PlayerModifierEmblemEndTurnWatchLyonarSmallMinionQuest';
    this.type = 'PlayerModifierEmblemEndTurnWatchLyonarSmallMinionQuest';

    this.prototype.maxStacks = 1;
  }

  static createContextObject(options) {
    const contextObject = super.createContextObject(true, false, options);
    return contextObject;
  }

  onTurnWatch(action) {
    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      return (() => {
        const result = [];
        for (const unit of Array.from(this.getGameSession().getBoard().getFriendlyEntitiesAroundEntity(this.getCard(), CardType.Unit, CONFIG.WHOLE_BOARD_RADIUS, false, false))) {
          if ((unit != null) && !unit.getIsGeneral() && (unit.getBaseCardId() !== Cards.Faction1.RightfulHeir)) {
            const originalCost = unit.getManaCost();
            let newCost = originalCost + 1;

            let allMinions = [];
            if (this.getGameSession().getGameFormat() === GameFormat.Standard) {
              allMinions = this.getGameSession().getCardCaches().getIsLegacy(false).getFaction(this.getCard().getFactionId())
                .getType(CardType.Unit)
                .getIsHiddenInCollection(false)
                .getIsToken(false)
                .getIsGeneral(false)
                .getIsPrismatic(false)
                .getIsSkinned(false)
                .getCards();
            } else {
              allMinions = this.getGameSession().getCardCaches().getFaction(this.getCard().getFactionId()).getType(CardType.Unit)
                .getIsHiddenInCollection(false)
                .getIsToken(false)
                .getIsGeneral(false)
                .getIsPrismatic(false)
                .getIsSkinned(false)
                .getCards();
            }

            if (allMinions.length > 0) {
              let availableMinionAtCost = false;
              let possibleCards = [];
              while (!availableMinionAtCost && (newCost >= 0)) {
                const tempPossibilities = [];
                for (const minion of Array.from(allMinions)) {
                  if (((minion != null ? minion.getManaCost() : undefined) === newCost) && (minion.getBaseCardId() !== Cards.Faction1.RightfulHeir)) {
                    possibleCards.push(minion);
                  }
                }
                if (possibleCards.length > 0) {
                  availableMinionAtCost = true;
                } else {
                  possibleCards = [];
                  newCost--;
                }
              }

              if ((possibleCards != null ? possibleCards.length : undefined) > 0) {
                // filter mythron cards
                possibleCards = _.reject(possibleCards, (card) => card.getRarityId() === 6);
              }

              if (possibleCards.length > 0) {
                const newUnit = possibleCards[this.getGameSession().getRandomIntegerForExecution(possibleCards.length)];

                if (newUnit.getManaCost() > unit.getManaCost()) {
                  const removeOriginalEntityAction = new RemoveAction(this.getGameSession());
                  removeOriginalEntityAction.setOwnerId(this.getCard().getOwnerId());
                  removeOriginalEntityAction.setTarget(unit);
                  this.getGameSession().executeAction(removeOriginalEntityAction);

                  const newCardData = newUnit.createNewCardData();
                  if (newCardData.additionalInherentModifiersContextObjects == null) { newCardData.additionalInherentModifiersContextObjects = []; }
                  newCardData.additionalInherentModifiersContextObjects.push(ModifierTransformed.createContextObject(unit.getExhausted(), unit.getMovesMade(), unit.getAttacksMade()));
                  const spawnEntityAction = new PlayCardAsTransformAction(this.getCard().getGameSession(), this.getCard().getOwnerId(), unit.getPosition().x, unit.getPosition().y, newCardData);
                  result.push(this.getGameSession().executeAction(spawnEntityAction));
                } else {
                  result.push(undefined);
                }
              } else {
                result.push(undefined);
              }
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
PlayerModifierEmblemEndTurnWatchLyonarSmallMinionQuest.initClass();

module.exports = PlayerModifierEmblemEndTurnWatchLyonarSmallMinionQuest;
