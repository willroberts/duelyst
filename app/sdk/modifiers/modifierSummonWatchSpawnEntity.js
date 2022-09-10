/* eslint-disable
    class-methods-use-this,
    consistent-return,
    import/no-unresolved,
    max-len,
    no-param-reassign,
    no-restricted-syntax,
    no-var,
    vars-on-top,
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
const UtilsJavascript = require('app/common/utils/utils_javascript');
const UtilsGameSession = require('app/common/utils/utils_game_session');
const UtilsPosition = require('app/common/utils/utils_position');
const CardType = require('app/sdk/cards/cardType');
const PlayCardSilentlyAction = require('app/sdk/actions/playCardSilentlyAction');
const PlayCardAction = require('app/sdk/actions/playCardAction');
const ModifierSummonWatch = require('./modifierSummonWatch');

class ModifierSummonWatchSpawnEntity extends ModifierSummonWatch {
  static initClass() {
    this.prototype.type = 'ModifierSummonWatchSpawnEntity';
    this.type = 'ModifierSummonWatchSpawnEntity';

    this.modifierName = 'Summon Watch';
    this.description = 'Whenever you summon a minion, summon %X';

    this.prototype.cardDataOrIndexToSpawn = null;

    this.prototype.fxResource = ['FX.Modifiers.ModifierSummonWatch', 'FX.Modifiers.ModifierGenericSpawn'];
  }

  static createContextObject(cardDataOrIndexToSpawn, spawnDescription, spawnCount, spawnPattern, spawnSilently, options) {
    if (spawnDescription == null) { spawnDescription = ''; }
    if (spawnCount == null) { spawnCount = 1; }
    if (spawnPattern == null) { spawnPattern = CONFIG.PATTERN_3x3; }
    if (spawnSilently == null) { spawnSilently = false; }
    const contextObject = super.createContextObject(options);
    contextObject.cardDataOrIndexToSpawn = cardDataOrIndexToSpawn;
    contextObject.spawnDescription = spawnDescription;
    contextObject.spawnCount = spawnCount;
    contextObject.spawnPattern = spawnPattern;
    contextObject.spawnSilently = spawnSilently;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      let replaceText = '';
      if (UtilsPosition.getArraysOfPositionsAreEqual(modifierContextObject.spawnPattern, CONFIG.PATTERN_1x1)) {
        replaceText = `a ${modifierContextObject.spawnDescription} in the same space`;
      } else if (modifierContextObject.spawnCount === 1) {
        replaceText = `a ${modifierContextObject.spawnDescription} into a nearby space`;
      } else if (modifierContextObject.spawnCount === 8) {
        replaceText = `${modifierContextObject.spawnDescription}s in all nearby spaces`;
      } else {
        replaceText = `${modifierContextObject.spawnDescription}s into ${modifierContextObject.spawnCount} nearby spaces`;
      }
      return this.description.replace(/%X/, replaceText);
    }
    return this.description;
  }

  onSummonWatch(action) {
    super.onSummonWatch(action);

    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      const ownerId = this.getSpawnOwnerId(action);
      const spawnPositions = UtilsGameSession.getRandomNonConflictingSmartSpawnPositionsForModifier(this, ModifierSummonWatchSpawnEntity);
      return (() => {
        const result = [];
        for (const spawnPosition of Array.from(spawnPositions)) {
          var spawnAction;
          const cardDataOrIndexToSpawn = this.getCardDataOrIndexToSpawn();
          if (this.spawnSilently) {
            spawnAction = new PlayCardSilentlyAction(this.getGameSession(), ownerId, spawnPosition.x, spawnPosition.y, cardDataOrIndexToSpawn);
          } else {
            spawnAction = new PlayCardAction(this.getGameSession(), ownerId, spawnPosition.x, spawnPosition.y, cardDataOrIndexToSpawn);
          }
          spawnAction.setSource(this.getCard());
          result.push(this.getGameSession().executeAction(spawnAction));
        }
        return result;
      })();
    }
  }

  getCardDataOrIndexToSpawn() {
    return this.cardDataOrIndexToSpawn;
  }

  getSpawnOwnerId(action) {
    return this.getCard().getOwnerId();
  }

  getIsCardRelevantToWatcher(card) {
    return true;
  }
}
ModifierSummonWatchSpawnEntity.initClass(); // default when no card restrictions are needed

module.exports = ModifierSummonWatchSpawnEntity;
