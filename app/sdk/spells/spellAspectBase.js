/* eslint-disable
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const ModifierTransformed = require('app/sdk/modifiers/modifierTransformed');
const CardType = require('app/sdk/cards/cardType');
const _ = require('underscore');
const SpellRemoveAndReplaceEntity = require('./spellRemoveAndReplaceEntity');

class SpellAspectBase extends SpellRemoveAndReplaceEntity {
  getCardDataOrIndexToSpawn(x, y) {
    let cardDataOrIndexToSpawn = super.getCardDataOrIndexToSpawn(x, y);

    const existingEntity = this.getGameSession().getBoard().getCardAtPosition({ x, y }, CardType.Entity);
    if (existingEntity != null) {
      if ((cardDataOrIndexToSpawn != null) && !_.isObject(cardDataOrIndexToSpawn)) { cardDataOrIndexToSpawn = this.getGameSession().getCardByIndex(cardDataOrIndexToSpawn).createNewCardData(); }
      if (cardDataOrIndexToSpawn.additionalInherentModifiersContextObjects == null) { cardDataOrIndexToSpawn.additionalInherentModifiersContextObjects = []; }
      cardDataOrIndexToSpawn.additionalInherentModifiersContextObjects.push(ModifierTransformed.createContextObject(existingEntity.getExhausted(), existingEntity.getMovesMade(), existingEntity.getAttacksMade()));
    }

    return cardDataOrIndexToSpawn;
  }
}

module.exports = SpellAspectBase;
