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
const Logger = require('app/common/logger');
const QuestType = require('./questTypeLookup');
const QuestBeginner = require('./questBeginner');

class QuestBeginnerWinFourPracticeGames extends QuestBeginner {
  static initClass() {
    this.Identifier = 9905;
    this.prototype.goldReward = 100;
  }

  constructor() {
    super(QuestBeginnerWinFourPracticeGames.Identifier, 'Win 4 Practice Games', [QuestType.Beginner], this.goldReward);
    this.params.completionProgress = 4;
  }

  _progressForGameDataForPlayerId(gameData, playerId) {
    for (const player of Array.from(gameData.players)) {
      const playerSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameData, player.playerId);
      Logger.module('Quests').debug(`QuestBeginnerWinFourPracticeGames checking ${player.playerId} game type ${playerSetupData.gameType} winner: ${player.isWinner}`);
      if ((player.playerId === playerId) && player.isWinner && (gameData.gameType === GameType.SinglePlayer)) {
        return 1;
      }
    }
    return 0;
  }

  getDescription() {
    return `Win ${this.params.completionProgress} game in practice mode.`;
  }
}
QuestBeginnerWinFourPracticeGames.initClass();

module.exports = QuestBeginnerWinFourPracticeGames;
