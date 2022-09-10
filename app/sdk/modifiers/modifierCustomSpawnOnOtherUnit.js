/* eslint-disable
    import/no-unresolved,
    no-restricted-syntax,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const ModifierCustomSpawn = 	require('./modifierCustomSpawn');

/*
	Base class for any modifier that will cause a unit to have custom spawn positions
	(other than Airdrop, as Airdrop is pre-defined)

*/
class ModifierCustomSpawnOnOtherUnit extends ModifierCustomSpawn {
  static initClass() {
    this.prototype.type = 'ModifierCustomSpawnOnOtherUnit';
    this.type = 'ModifierCustomSpawnOnOtherUnit';

    this.modifierName = 'Custom Spawn';
    this.description = '';

    this.prototype.fxResource = ['FX.Modifiers.ModifierCustomSpawn'];
  }

  getCustomSpawnPositions() {
    const validSpawnLocations = [];
    const board = this.getGameSession().getBoard();
    for (const entity of Array.from(board.getEntities())) {
      if ((entity.getType() === CardType.Unit) && !entity.getIsGeneral()) {
        validSpawnLocations.push(entity.getPosition());
      }
    }
    return validSpawnLocations;
  }
}
ModifierCustomSpawnOnOtherUnit.initClass();

module.exports = ModifierCustomSpawnOnOtherUnit;
