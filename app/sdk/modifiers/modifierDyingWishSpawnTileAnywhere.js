// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const ModifierDyingWishSpawnEntityAnywhere = require('./modifierDyingWishSpawnEntityAnywhere');

class ModifierDyingWishSpawnTileAnywhere extends ModifierDyingWishSpawnEntityAnywhere {
  static initClass() {
    this.prototype.type = 'ModifierDyingWishSpawnTileAnywhere';
    this.type = 'ModifierDyingWishSpawnTileAnywhere';

    this.description = 'Turn %X';

    this.prototype.fxResource = ['FX.Modifiers.ModifierDyingWish', 'FX.Modifiers.ModifierGenericSpawn'];
  }

  static getDescription(modifierContextObject) {
    if (modifierContextObject) {
      return this.description.replace(/%X/, modifierContextObject.spawnDescription);
    }
    return this.description;
  }
}
ModifierDyingWishSpawnTileAnywhere.initClass();

module.exports = ModifierDyingWishSpawnTileAnywhere;
