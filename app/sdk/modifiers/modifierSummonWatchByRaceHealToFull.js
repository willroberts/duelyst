/* eslint-disable
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const HealAction = require('app/sdk/actions/healAction');
const ModifierSummonWatch = require('./modifierSummonWatch');

class ModifierSummonWatchByRaceHealToFull extends ModifierSummonWatch {
  static initClass() {
    this.prototype.type = 'ModifierSummonWatchByRaceHealToFull';
    this.type = 'ModifierSummonWatchByRaceHealToFull';

    this.modifierName = 'Summon Watch (by race heal to full)';
    this.description = 'Whenever you summon %X, restore this minion to full health';

    this.prototype.fxResource = ['FX.Modifiers.ModifierSummonWatch', 'FX.Modifiers.ModifierGenericHeal'];
  }

  static createContextObject(targetRaceId, raceName, options) {
    const contextObject = super.createContextObject(options);
    contextObject.targetRaceId = targetRaceId;
    contextObject.raceName = raceName;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return this.description.replace(/%X/, modifierContextObject.raceName);
    }
    return this.description;
  }

  onSummonWatch(action) {
    const healAction = this.getCard().getGameSession().createActionForType(HealAction.type);
    healAction.setTarget(this.getCard());
    healAction.setHealAmount(this.getCard().getMaxHP() - this.getCard().getHP());
    return this.getCard().getGameSession().executeAction(healAction);
  }

  getIsCardRelevantToWatcher(card) {
    return card.getBelongsToTribe(this.targetRaceId);
  }
}
ModifierSummonWatchByRaceHealToFull.initClass();

module.exports = ModifierSummonWatchByRaceHealToFull;
