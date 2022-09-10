/* eslint-disable
    import/no-unresolved,
    max-len,
    no-param-reassign,
    no-restricted-syntax,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const SpellApplyModifiers = require('./spellApplyModifiers');

class SpellChargeIntoBattle extends SpellApplyModifiers {
  _postFilterPlayPositions(validPositions) {
    // use super filter play positions
    let player1;
    validPositions = super._postFilterPlayPositions(validPositions);
    const filteredValidPositions = [];

    // find unit that is behind the general
    const generalPosition = this.getGameSession().getGeneralForPlayerId(this.getOwnerId()).getPosition();
    if (this.getGameSession().getGeneralForPlayerId(this.getOwnerId()).isOwnedByPlayer1()) {
      player1 = true;
    } else {
      player1 = false;
    }

    for (const position of Array.from(validPositions)) {
      const unit = this.getGameSession().getBoard().getUnitAtPosition(position);
      if (player1 && ((unit != null ? unit.getPosition().x : undefined) === (generalPosition.x - 1)) && (unit.getPosition().y === generalPosition.y)) {
        filteredValidPositions.push(unit.getPosition());
      }
      if (!player1 && ((unit != null ? unit.getPosition().x : undefined) === (generalPosition.x + 1)) && (unit.getPosition().y === generalPosition.y)) {
        filteredValidPositions.push(unit.getPosition());
      }
    }

    return filteredValidPositions;
  }
}

module.exports = SpellChargeIntoBattle;
