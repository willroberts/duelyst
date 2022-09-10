/* eslint-disable
    import/no-unresolved,
    max-len,
    no-restricted-syntax,
    no-tabs,
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
const ModifierSilence = 		require('app/sdk/modifiers/modifierSilence');
const _ = require('underscore');
const SpellSpawnEntityRandomlyAroundTarget = require('./spellSpawnEntityRandomlyAroundTarget.coffee');
const Cards = require('../cards/cardsLookupComplete.coffee');
const UtilsGameSession = require('../../common/utils/utils_game_session.coffee');

class SpellSilenceAndSpawnEntityNearby extends SpellSpawnEntityRandomlyAroundTarget {
  static initClass() {
    this.prototype.targetType = CardType.Unit;
  }

  onApplyEffectToBoardTile(board, x, y, sourceAction) {
    super.onApplyEffectToBoardTile(board, x, y, sourceAction);

    const applyEffectPositions = this.getApplyEffectPositions();

    return (() => {
      const result = [];
      for (const position of Array.from(applyEffectPositions)) {
        const unit = board.getUnitAtPosition(position);
        if ((unit != null) && (unit.getOwnerId() !== this.getOwnerId())) {
          result.push(this.getGameSession().applyModifierContextObject(ModifierSilence.createContextObject(), unit));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}
SpellSilenceAndSpawnEntityNearby.initClass();

module.exports = SpellSilenceAndSpawnEntityNearby;
