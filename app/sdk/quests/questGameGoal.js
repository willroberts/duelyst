/* eslint-disable
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
const GameStatus = require('app/sdk/gameStatus');
const GameType = require('app/sdk/gameType');
const UtilsGameSession = require('app/common/utils/utils_game_session');
const Quest = require('./quest');

/*
  QuestGameGoal - creates a quest that makes progress through a goalTester
*/

class QuestGameGoal extends Quest {
  static initClass() {
    this.prototype.description = undefined; // user visible description of quest
    // goalTester format : (gameSessionData,playerIdString) -> return questProgress
    this.prototype.goalTester = undefined;
		 // see format above
  }

  // numGamesRequiredToSatisfyQuest - how many times the goal must be met to award quest gold
  constructor(id, name, typesIn, reward, numGamesRequiredToSatisfyQuest, description, goalTester) {
    super(id, name, typesIn, reward);
    this.params.completionProgress = numGamesRequiredToSatisfyQuest;
    this.description = description;
    this.goalTester = goalTester;
  }

  _progressForGameDataForPlayerId(gameData, playerId) {
    for (const player of Array.from(gameData.players)) {
      const playerSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameData, player.playerId);
      if ((player.playerId === playerId) && GameType.isCompetitiveGameType(gameData.gameType)) {
        return this.goalTester(gameData, playerId);
      }
    }
    return 0;
  }

  getDescription() {
    return this.description;
  }
}
QuestGameGoal.initClass();

module.exports = QuestGameGoal;
