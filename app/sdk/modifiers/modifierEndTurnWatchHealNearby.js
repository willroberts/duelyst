/* eslint-disable
    import/no-unresolved,
    max-len,
    no-param-reassign,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const HealAction = require('app/sdk/actions/healAction');
const ModifierEndTurnWatch = require('./modifierEndTurnWatch');

class ModifierEndTurnWatchHealNearby extends ModifierEndTurnWatch {
  static initClass() {
    this.prototype.type = 'ModifierEndTurnWatchHealNearby';
    this.type = 'ModifierEndTurnWatchHealNearby';

    this.modifierName = 'End Watch';
    this.description = 'At the end of your turn, restore %X Health to all nearby friendly minions';

    this.prototype.healAmount = 0;
    this.prototype.healGeneral = false;

    this.prototype.fxResource = ['FX.Modifiers.ModifierEndTurnWatch', 'FX.Modifiers.ModifierGenericHeal'];
  }

  static createContextObject(healAmount, healGeneral, options) {
    if (healAmount == null) { healAmount = 1; }
    if (healGeneral == null) { healGeneral = false; }
    const contextObject = super.createContextObject(options);
    contextObject.healAmount = healAmount;
    contextObject.healGeneral = healGeneral;
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return this.description.replace(/%X/, modifierContextObject.healAmount);
    }
    return this.description;
  }

  onTurnWatch(action) {
    const entities = this.getGameSession().getBoard().getFriendlyEntitiesAroundEntity(this.getCard(), CardType.Unit, 1);
    return (() => {
      const result = [];
      for (const entity of Array.from(entities)) {
        if (this.healGeneral || !entity.getIsGeneral()) {
          const healAction = new HealAction(this.getGameSession());
          healAction.setOwnerId(this.getCard().getOwnerId());
          healAction.setSource(this.getCard());
          healAction.setTarget(entity);
          healAction.setHealAmount(this.healAmount);
          result.push(this.getGameSession().executeAction(healAction));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}
ModifierEndTurnWatchHealNearby.initClass();

module.exports = ModifierEndTurnWatchHealNearby;
