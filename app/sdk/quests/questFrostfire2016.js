/* eslint-disable
    class-methods-use-this,
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
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

class QuestFrostfire2016 extends Quest {
  static initClass() {
    this.Identifier = 30001; // ID to use for this quest
    this.prototype.isReplaceable = false; // whether a player can replace this quest
    this.prototype.giftChests = [GiftCrateLookup.Frostfire2016];
    this.prototype.rewardDetails = 'Gift Box contains: Saberspine Tiger Skin, 100 Gold, 1 Rare Crate Key.';
  }

  constructor() {
    super(QuestFrostfire2016.Identifier, 'Frostfire', [QuestType.Seasonal]);
    this.params.completionProgress = 15;
  }

  progressForQuestCompletion() {
    return 1;
  }

  getDescription() {
    return `Complete ${this.params.completionProgress} quests.`;
  }

  isAvailableOn(momentUtc) {
    return momentUtc.isAfter(moment.utc('2016-12-01')) && momentUtc.isBefore(moment.utc('2017-01-01'));
  }
}
QuestFrostfire2016.initClass();

module.exports = QuestFrostfire2016;
