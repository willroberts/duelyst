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
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const GameStatus = require('app/sdk/gameStatus');
const GameType = require('app/sdk/gameType');
const UtilsGameSession = require('app/common/utils/utils_game_session');
const GiftCrateLookup = require('app/sdk/giftCrates/giftCrateLookup');
const moment = require('moment');
const QuestType = require('./questTypeLookup');
const Quest = require('./quest');

class QuestAnniversary2017 extends Quest {
  static initClass() {
    this.Identifier = 40001; // ID to use for this quest
    this.prototype.isReplaceable = false; // whether a player can replace this quest
    this.prototype.giftChests = [GiftCrateLookup.Anniversary2017];
    this.prototype.rewardDetails = 'Gift Box contains: Some sweet rewards!';
  }

  constructor() {
    super(QuestAnniversary2017.Identifier, 'Anniversary', [QuestType.Promotional]);
    this.params.completionProgress = 1;
    this.riftMatchesCount = true;
  }

  _progressForGameDataForPlayerId(gameData, playerId) {
    for (const player of Array.from(gameData.players)) {
      const playerSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameData, player.playerId);
      if ((player.playerId === playerId) && player.isWinner && (gameData.gameType === GameType.Rift)) {
        return 1;
      }
    }
    return 0;
  }

  getDescription() {
    return `Win ${this.params.completionProgress} Rift Match.<br>Expires May 12th UTC`;
  }

  isAvailableOn(momentUtc) {
    return momentUtc.isAfter(moment.utc('2017-04-25')) && momentUtc.isBefore(moment.utc('2017-05-13'));
  }

  expiresOn() {
    return moment.utc('2017-05-12');
  }
}
QuestAnniversary2017.initClass();

module.exports = QuestAnniversary2017;
