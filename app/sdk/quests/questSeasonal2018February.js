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
const CosmeticsChestTypeLookup = require('app/sdk/cosmetics/cosmeticsChestTypeLookup');
const i18next = require('i18next');
const moment = require('moment');
const QuestType = require('./questTypeLookup');
const Quest = require('./quest');

class QuestSeasonal2018February extends Quest {
  static initClass() {
    this.Identifier = 30007; // ID to use for this quest
    this.prototype.isReplaceable = false; // whether a player can replace this quest
    this.prototype.cosmeticKeys = [CosmeticsChestTypeLookup.Rare];
    this.prototype.rewardDetails = '1 Rare Crate Key.';
  }

  constructor() {
    super(QuestSeasonal2018February.Identifier, i18next.t('quests.monthly_quest_title'), [QuestType.Seasonal]);
    this.params.completionProgress = 15;
  }

  progressForQuestCompletion() {
    return 1;
  }

  getDescription() {
    return i18next.t('quests.monthly_quest_desc', { count: this.params.completionProgress });
  }

  isAvailableOn(momentUtc) {
    return momentUtc.isAfter(moment.utc('2018-01-30')) && momentUtc.isBefore(moment.utc('2018-03-01'));
  }
}
QuestSeasonal2018February.initClass();

module.exports = QuestSeasonal2018February;
