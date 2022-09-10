/* eslint-disable
    consistent-return,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const i18next = require('i18next');
const ModifierQuestStatus = require('./modifierQuestStatus');

class ModifierQuestStatusLyonar extends ModifierQuestStatus {
  static initClass() {
    this.prototype.type = 'ModifierQuestStatusLyonar';
    this.type = 'ModifierQuestStatusLyonar';
  }

  static createContextObject(questCompleted, numMinionsSummoned) {
    const contextObject = super.createContextObject();
    contextObject.questCompleted = questCompleted;
    contextObject.numMinionsSummoned = numMinionsSummoned;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      if (modifierContextObject.questCompleted) {
        return i18next.t('modifiers.quest_completed_applied_desc');
      }
      return i18next.t('modifiers.lyonarquest_counter_applied_desc', { summon_count: modifierContextObject.numMinionsSummoned });
    }
  }

  static getName(modifierContextObject) {
    return i18next.t('modifiers.lyonarquest_counter_applied_name');
  }
}
ModifierQuestStatusLyonar.initClass();

module.exports = ModifierQuestStatusLyonar;
