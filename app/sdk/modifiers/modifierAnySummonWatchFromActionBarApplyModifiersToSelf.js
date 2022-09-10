/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PlayCardFromHandAction = require('app/sdk/actions/playCardFromHandAction');
const CardType = require('app/sdk/cards/cardType');
const i18next = require('i18next');
const ModifierAnySummonWatchFromActionBar = require('./modifierAnySummonWatchFromActionBar');

class ModifierAnySummonWatchFromActionBarApplyModifiersToSelf extends ModifierAnySummonWatchFromActionBar {
  static initClass() {
    this.prototype.type = 'ModifierAnySummonWatchFromActionBarApplyModifiersToSelf';
    this.type = 'ModifierAnySummonWatchFromActionBarApplyModifiersToSelf';

    this.description = i18next.t('modifiers.any_summon_watch_from_action_bar_apply_modifiers_def');

    this.prototype.fxResource = ['FX.Modifiers.ModifierSummonWatch', 'FX.Modifiers.ModifierGenericBuff'];
  }

  static createContextObject(modifiersContextObjects, buffDescription, options) {
    const contextObject = super.createContextObject(options);
    contextObject.modifiersContextObjects = modifiersContextObjects;
    contextObject.buffDescription = buffDescription;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return i18next.t('modifiers.any_summon_watch_from_action_bar_apply_modifiers_def', { desc: this.buffDescription });
    }
    return this.description;
  }

  onSummonWatch(action) {
    if (this.modifiersContextObjects != null) {
      return Array.from(this.modifiersContextObjects).map((modifierContextObject) => this.getGameSession().applyModifierContextObject(modifierContextObject, this.getCard()));
    }
  }
}
ModifierAnySummonWatchFromActionBarApplyModifiersToSelf.initClass();

module.exports = ModifierAnySummonWatchFromActionBarApplyModifiersToSelf;
