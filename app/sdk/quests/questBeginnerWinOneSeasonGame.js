/* eslint-disable
    class-methods-use-this,
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
    no-this-before-super,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const UtilsGameSession = require('app/common/utils/utils_game_session');
const GameType = require('app/sdk/gameType');
const i18next = require('i18next');
const QuestType = require('./questTypeLookup');
const QuestBeginner = require('./questBeginner');

class QuestBeginnerWinOneSeasonGame extends QuestBeginner {
  static initClass() {
    this.Identifier = 9910;
    this.prototype.goldReward = 50;
  }

  constructor() {
    super(QuestBeginnerWinOneSeasonGame.Identifier, i18next.t('quests.quest_beginner_win_ladder_game_title'), [QuestType.Beginner], this.goldReward);
    this.params.completionProgress = 1;
  }

  _progressForGameDataForPlayerId(gameData, playerId) {
    for (const player of Array.from(gameData.players)) {
      const playerSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameData, player.playerId);
      if ((player.playerId === playerId) && player.isWinner && ((gameData.gameType === GameType.Casual) || (gameData.gameType === GameType.Ranked))) {
        return 1;
      }
    }
    return 0;
  }

  getDescription() {
    return i18next.t('quests.quest_beginner_win_ladder_game_desc', { count: this.params.completionProgress });
  }
}
QuestBeginnerWinOneSeasonGame.initClass();
// return "Win #{@params["completionProgress"]} Season Ladder Game."

module.exports = QuestBeginnerWinOneSeasonGame;
