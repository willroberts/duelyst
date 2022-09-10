/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-restricted-syntax,
    no-underscore-dangle,
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
const CardType = require('app/sdk/cards/cardType');
const PlayCardSilentlyAction = require('app/sdk/actions/playCardSilentlyAction');
const Spell = require('./spell');
const SpellFilterType = require('./spellFilterType');

class SpellDropLift extends Spell {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
    this.prototype.spellFilterType = SpellFilterType.NeutralIndirect;
    this.prototype.canTargetGeneral = true;
  }

  onApplyOneEffectToBoard(board, x, y, sourceAction) {
    const enemyGeneral = this.getGameSession().getGeneralForOpponentOfPlayerId(this.getOwnerId());
    const myGeneral = this.getGameSession().getGeneralForPlayerId(this.getOwnerId());

    if (enemyGeneral && myGeneral) {
      const modifiersByArtifact = enemyGeneral.getArtifactModifiersGroupedByArtifactCard();
      if (modifiersByArtifact.length > 0) {
        // pick an artifact to remove (modifiers grouped by artifact card)
        const modifiersToRemove = modifiersByArtifact[this.getGameSession().getRandomIntegerForExecution(modifiersByArtifact.length)];
        const artifactCard = modifiersToRemove[0].getSourceCard(); // store original artifact card
        // remove modifiers from artifact on enemy
        for (let i = modifiersToRemove.length - 1; i >= 0; i--) {
          const modifier = modifiersToRemove[i];
          this.getGameSession().removeModifier(modifier);
        }

        const newArtifactCardData = artifactCard.createNewCardData();

        // copy over any custom artifact data
        if (artifactCard.targetModifiersContextObjects != null) {
          newArtifactCardData.targetModifiersContextObjects = artifactCard.targetModifiersContextObjects;
        }
        if (artifactCard.modifiersContextObjects) {
          for (const contextObject of Array.from(artifactCard.modifiersContextObjects)) {
            if (contextObject.isAdditionalInherent) {
              if (newArtifactCardData.additionalInherentModifiersContextObjects == null) { newArtifactCardData.additionalInherentModifiersContextObjects = []; }
              newArtifactCardData.additionalInherentModifiersContextObjects.push(contextObject);
            }
          }
        }

        // apply artifact to my general
        const playCardAction = new PlayCardSilentlyAction(this.getGameSession(), this.getOwnerId(), myGeneral.getPosition().x, myGeneral.getPosition().y, newArtifactCardData);
        playCardAction.setSource(this);
        return this.getGameSession().executeAction(playCardAction);
      }
    }
  }

  _findApplyEffectPositions(position, sourceAction) {
    const applyEffectPositions = [];

    // only affects generals
    const enemyGeneral = this.getGameSession().getGeneralForOpponentOfPlayerId(this.getOwnerId());
    if (enemyGeneral != null) { applyEffectPositions.push(enemyGeneral.getPosition()); }
    const myGeneral = this.getGameSession().getGeneralForPlayerId(this.getOwnerId());
    if (myGeneral != null) { applyEffectPositions.push(myGeneral.getPosition()); }

    return applyEffectPositions;
  }
}
SpellDropLift.initClass();

module.exports = SpellDropLift;
