/* eslint-disable
    import/no-unresolved,
    prefer-rest-params,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const UtilsGameSession = require('app/common/utils/utils_game_session');
const GameType = require('app/sdk/gameType');
const Quest = require('./quest');
const QuestType = require('./questTypeLookup');

class QuestBeginner extends Quest {
  static initClass() {
    // TODO: needs documentation
    this.prototype.isReplaceable = false;
    this.prototype.isRequired = true;
    this.prototype.isBeginner = true;
  }

  constructor() {
    super(...arguments);
    if (Math.floor(this.id / 100) !== 99) {
      throw new Error('Invalid Beginner Quest ID');
    }
  }
}
QuestBeginner.initClass();

module.exports = QuestBeginner;
