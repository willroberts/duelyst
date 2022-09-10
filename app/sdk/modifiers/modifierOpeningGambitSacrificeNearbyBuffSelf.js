/* eslint-disable
    import/no-unresolved,
    max-len,
    no-nested-ternary,
    no-param-reassign,
    no-plusplus,
    no-restricted-syntax,
    no-tabs,
    no-underscore-dangle,
    no-use-before-define,
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
const KillAction = 		require('app/sdk/actions/killAction');
const CardType = 								require('app/sdk/cards/cardType');
const Stringifiers = 						require('app/sdk/helpers/stringifiers');
let Modifier = 								require('./modifier');
const ModifierOpeningGambit = 			require('./modifierOpeningGambit');
Modifier =								require('./modifier');

class ModifierOpeningGambitSacrificeNearbyBuffSelf extends ModifierOpeningGambit {
  static initClass() {
    this.prototype.type = 'ModifierOpeningGambitSacrificeNearbyBuffSelf';
    this.type = 'ModifierOpeningGambitSacrificeNearbyBuffSelf';

    this.modifierName = 'Opening Gambit';
    this.description = 'Destroy friendly minions around it and gain %X for each minion';

    this.prototype.targetEnemies = false;
    this.prototype.targetAllies = true;
    this.prototype.fxResource = ['FX.Modifiers.ModifierOpeningGambit', 'FX.Modifiers.ModifierGenericDamageNearbyShadow'];
  }

  getPrivateDefaults(gameSession) {
    const p = super.getPrivateDefaults(gameSession);

    p.numSacrificed = 0;

    return p;
  }

  static createContextObject(attackBuff, maxHPBuff, options) {
    if (attackBuff == null) { attackBuff = 0; }
    if (maxHPBuff == null) { maxHPBuff = 0; }
    if (options == null) { options = undefined; }
    const contextObject = super.createContextObject(options);
    const statBuffContextObject = Modifier.createContextObjectWithAttributeBuffs(attackBuff, maxHPBuff);
    statBuffContextObject.appliedName = 'Consumed Strength';
    contextObject.modifiersContextObjects = [statBuffContextObject];
    return contextObject;
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      const subContextObject = modifierContextObject.modifiersContextObjects[0];
      return this.description.replace(/%X/, Stringifiers.stringifyAttackHealthBuff(subContextObject.attributeBuffs.atk, subContextObject.attributeBuffs.maxHP));
    }
    return this.description;
  }

  applyManagedModifiersFromModifiersContextObjects(modifiersContextObjects, card) {
    // apply once per sacrifice
    return __range__(0, this._private.numSacrificed, false).map((i) => super.applyManagedModifiersFromModifiersContextObjects(modifiersContextObjects, card));
  }

  onOpeningGambit() {
    super.onOpeningGambit();

    const entities = this.getGameSession().getBoard().getFriendlyEntitiesAroundEntity(this.getCard(), CardType.Unit, 1);
    for (const entity of Array.from(entities)) {
      // don't kill general
      if (!entity.getIsGeneral()) {
        const damageAction = new KillAction(this.getGameSession());
        damageAction.setOwnerId(this.getCard().getOwnerId());
        damageAction.setSource(this.getCard());
        damageAction.setTarget(entity);
        this.getGameSession().executeAction(damageAction);
        this._private.numSacrificed++;
      }
    }

    return this.applyManagedModifiersFromModifiersContextObjects(this.modifiersContextObjects, this.getCard());
  }
}
ModifierOpeningGambitSacrificeNearbyBuffSelf.initClass();

module.exports = ModifierOpeningGambitSacrificeNearbyBuffSelf;

function __range__(left, right, inclusive) {
  const range = [];
  const ascending = left < right;
  const end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
