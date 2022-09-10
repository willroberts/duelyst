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
const QuestBeginner = require('./questBeginner');
const QuestType = require('./questTypeLookup');

class QuestBeginnerPlayOneQuickMatch extends QuestBeginner {
  static initClass() {
    this.Identifier = 9903;
    this.prototype.goldReward = 100;
  }

  constructor() {
    super(QuestBeginnerPlayOneQuickMatch.Identifier, 'Into the Fray', [QuestType.Beginner], this.goldReward);
    this.params.completionProgress = 1;
  }

  _progressForGameDataForPlayerId(gameData, playerId) {
    for (const player of Array.from(gameData.players)) {
      const playerSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameData, player.playerId);
      if ((player.playerId === playerId) && (gameData.gameType === GameType.Casual)) {
        return 1;
      }
    }
    return 0;
  }

  getDescription() {
    return `Play ${this.params.completionProgress} Quick Match.`;
  }
}
QuestBeginnerPlayOneQuickMatch.initClass();

module.exports = QuestBeginnerPlayOneQuickMatch;
