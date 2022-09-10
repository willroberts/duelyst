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

class QuestAlternateDealDamage extends Quest {
  constructor(id, name, typesIn, reward) {
    super(id, name, typesIn, reward);
    this.params.completionProgress = 40;
  }

  _progressForGameDataForPlayerId(gameData, playerId) {
    for (const player of Array.from(gameData.players)) {
      const playerSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameData, player.playerId);
      if ((player.playerId === playerId) && GameType.isCompetitiveGameType(gameData.gameType)) {
        return player.totalDamageDealt;
      }
    }
    return 0;
  }

  getDescription() {
    return `Deal ${this.params.completionProgress} damage to enemy units.`;
  }
}

module.exports = QuestAlternateDealDamage;
