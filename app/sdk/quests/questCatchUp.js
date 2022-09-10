/* eslint-disable
    class-methods-use-this,
    import/no-unresolved,
    max-len,
    no-mixed-spaces-and-tabs,
    no-restricted-syntax,
    no-tabs,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const UtilsGameSession = require('app/common/utils/utils_game_session');
const GameType = require('app/sdk/gameType');
const i18next = require('i18next');
const QuestType = require('./questTypeLookup');
const Quest = require('./quest');

class QuestCatchUp extends Quest {
  static initClass() {
    this.Identifier = 20000; // ID to use for this quest

    this.prototype.isReplaceable = false; // whether a player can replace this quest
    this.prototype.isCatchUp = true; // defines this as a catchup quest
    this.prototype.goldReward = undefined;
		 // This is a changing quantity updated to the database when users gain charges
  }

  constructor() {
    super(QuestCatchUp.Identifier, i18next.t('quests.quest_welcome_back_title'), [QuestType.CatchUp]);
    this.params.completionProgress = 3;
  }

  _progressForGameDataForPlayerId(gameData, playerId) {
    // Gain progress for any games played
    for (const player of Array.from(gameData.players)) {
      const playerSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameData, player.playerId);
      if ((player.playerId === playerId) && GameType.isCompetitiveGameType(gameData.gameType)) {
        return 1;
      }
    }
    return 0;
  }

  getDescription() {
    return i18next.t('quests.quest_welcome_back_desc', { count: this.params.completionProgress });
  }
}
QuestCatchUp.initClass();
// return "Play #{@params["completionProgress"]} Games."

module.exports = QuestCatchUp;
