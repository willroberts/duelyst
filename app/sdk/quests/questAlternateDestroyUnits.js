/* eslint-disable
    class-methods-use-this,
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const GameStatus = require('app/sdk/gameStatus');
const GameType = require('app/sdk/gameType');
const UtilsGameSession = require('app/common/utils/utils_game_session');
const Quest = require('./quest');

class QuestAlternateDestroyUnits extends Quest {
  constructor(id, name, typesIn, reward) {
    super(id, name, typesIn, reward);
    this.params.completionProgress = 2;
  }

  _progressForGameDataForPlayerId(gameData, playerId) {
    for (const player of Array.from(gameData.players)) {
      const playerSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameData, player.playerId);
      if ((player.playerId === playerId) && GameType.isCompetitiveGameType(gameData.gameType)) {
        return player.totalMinionsKilled;
      }
    }
    return 0;
  }

  getDescription() {
    return `Destroy ${this.params.completionProgress} enemy units.`;
  }
}

module.exports = QuestAlternateDestroyUnits;
