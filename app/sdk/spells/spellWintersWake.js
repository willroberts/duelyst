/* eslint-disable
    import/no-unresolved,
    no-restricted-syntax,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const ModifierWall = require('app/sdk/modifiers/modifierWall');
const SpellApplyModifiers = require('./spellApplyModifiers.coffee');

class SpellWintersWake extends SpellApplyModifiers {
  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    // this should be only applying to Walls
    const card = this.getGameSession().getBoard().getCardAtPosition({ x, y });
    const wallMod = card.getModifierByClass(ModifierWall);
    // allow this Wall to move
    if (wallMod != null) {
      wallMod.allowMove();
    }

    return super.onApplyEffectToBoardTile(board, x, y, sourceAction);
  }

  _filterApplyPositions(spellPositions) {
    // applies only to Walls
    const applyEffectPositions = super._filterApplyPositions(spellPositions);
    const finalApplyEffectPositions = [];
    for (const position of Array.from(applyEffectPositions)) {
      const card = this.getGameSession().getBoard().getCardAtPosition(position);
      if (card.hasModifierClass(ModifierWall)) {
        finalApplyEffectPositions.push(position);
      }
    }
    return finalApplyEffectPositions;
  }
}

module.exports = SpellWintersWake;
