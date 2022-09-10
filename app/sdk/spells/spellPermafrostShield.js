/* eslint-disable
    import/no-unresolved,
    max-len,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const Races = require('app/sdk/cards/racesLookup');
const Modifier = require('app/sdk/modifiers/modifier');
const _ = require('underscore');
const SpellFilterType =	require('./spellFilterType');
const SpellApplyModifiers = require('./spellApplyModifiers');

class SpellPermafrostShield extends SpellApplyModifiers {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.AllyDirect;

    this.prototype.attackBuff = 0;
    this.prototype.healthBuff = 0;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    const applyEffectPosition = { x, y };
    const entity = board.getCardAtPosition(applyEffectPosition, this.targetType);
    if (entity.getBelongsToTribe(Races.Vespyr)) {
      this.targetModifiersContextObjects	= [Modifier.createContextObjectWithAttributeBuffs(this.attackBuff, this.healthBuff)];
    } else {
      this.targetModifiersContextObjects	= [Modifier.createContextObjectWithAttributeBuffs(this.attackBuff)];
    }
    this.targetModifiersContextObjects[0].appliedName = 'Frozen Resolve';
    return super.onApplyEffectToBoardTile(board, x, y, sourceAction);
  }
}
SpellPermafrostShield.initClass();

module.exports = SpellPermafrostShield;
