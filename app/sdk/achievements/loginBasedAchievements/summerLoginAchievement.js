/* eslint-disable
    import/no-unresolved,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Achievement = require('app/sdk/achievements/achievement');
const moment = require('moment');
const GiftCrateLookup = require('app/sdk/giftCrates/giftCrateLookup');
const i18next = require('i18next');

class SummerLoginAchievement extends Achievement {
  static initClass() {
    this.id = 'summerLoginAchievement';
    this.title = 'SUMMER TIME CELEBRATION';
    this.description = 'HERE\'S 3 UNEARTHED ORBS TO CELEBRATE';
    this.progressRequired = 1;
    this.rewards =			{ giftChests: [GiftCrateLookup.SummerLogin] };

    this.enabled = true;
  }

  static progressForLoggingIn(currentLoginMoment) {
    if ((currentLoginMoment !== null) && currentLoginMoment.isAfter(moment.utc('2018-08-03T11:00-07:00')) && currentLoginMoment.isBefore(moment.utc('2018-08-10T11:00-07:00'))) {
      return 1;
    }
    return 0;
  }

  static getLoginAchievementStartsMoment() {
    return moment.utc('2018-08-03T11:00-07:00');
  }
}
SummerLoginAchievement.initClass();

module.exports = SummerLoginAchievement;
