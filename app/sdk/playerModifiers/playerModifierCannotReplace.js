/* eslint-disable
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PlayerModifier = require('app/sdk/playerModifiers/playerModifier');

class PlayerModifierCannotReplace extends PlayerModifier {
  static initClass() {
    this.prototype.type = 'PlayerModifierCannotReplace';
    this.type = 'PlayerModifierCannotReplace';
  }
}
PlayerModifierCannotReplace.initClass();

module.exports = PlayerModifierCannotReplace;
