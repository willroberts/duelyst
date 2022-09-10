/* eslint-disable
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const ModifierRemoveAndReplaceEntity = require('app/sdk/modifiers/modifierRemoveAndReplaceEntity');
const ModifierTransformed = require('app/sdk/modifiers/modifierTransformed');
const CardType = require('app/sdk/cards/cardType');
const DamageAction = require('app/sdk/actions/damageAction');
const _ = require('underscore');
const SpellRemoveAndReplaceEntity = require('./spellRemoveAndReplaceEntity');

class SpellTempTransform extends SpellRemoveAndReplaceEntity {
  static initClass() {
    this.prototype.durationEndTurn = 0;
    this.prototype.durationStartTurn = 0;
  }

  getCardDataOrIndexToSpawn(x, y) {
    let cardDataOrIndexToSpawn = super.getCardDataOrIndexToSpawn(x, y);

    const existingEntity = this.getGameSession().getBoard().getCardAtPosition({ x, y }, CardType.Entity);
    if (existingEntity != null) {
      // create modifier from existing entity
      const existingEntityCardData = existingEntity.createNewCardData();

      // create modifier to transform this entity back to its original form
      const transformBackModifierContextObject = ModifierRemoveAndReplaceEntity.createContextObject(existingEntityCardData, existingEntity.getBaseCardId());
      transformBackModifierContextObject.durationEndTurn = this.durationEndTurn;
      transformBackModifierContextObject.durationStartTurn = this.durationStartTurn;
      transformBackModifierContextObject.isInherent = true;
      if ((cardDataOrIndexToSpawn != null) && !_.isObject(cardDataOrIndexToSpawn)) { cardDataOrIndexToSpawn = this.getGameSession().getCardByIndex(cardDataOrIndexToSpawn).createNewCardData(); }
      if (cardDataOrIndexToSpawn.additionalInherentModifiersContextObjects == null) { cardDataOrIndexToSpawn.additionalInherentModifiersContextObjects = []; }
      cardDataOrIndexToSpawn.additionalInherentModifiersContextObjects.push(ModifierTransformed.createContextObject(existingEntity.getExhausted(), existingEntity.getMovesMade(), existingEntity.getAttacksMade()));
      cardDataOrIndexToSpawn.additionalInherentModifiersContextObjects.push(transformBackModifierContextObject);
    }

    return cardDataOrIndexToSpawn;
  }
}
SpellTempTransform.initClass();

module.exports = SpellTempTransform;
