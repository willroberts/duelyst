/* eslint-disable
    import/no-unresolved,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PlayCardAsTransformAction = require('app/sdk/actions/playCardAsTransformAction');
const ModifierBuilding = require('app/sdk/modifiers/modifierBuilding');
const ModifierBuildWatch = require('./modifierBuildWatch');

class ModifierMyBuildWatch extends ModifierBuildWatch {
  static initClass() {
    this.prototype.type = 'ModifierMyBuildWatch';
    this.type = 'ModifierMyBuildWatch';
  }

  getIsActionRelevant(action) {
    return super.getIsActionRelevant(action) && (action.getOwnerId() === this.getCard().getOwnerId());
  }
}
ModifierMyBuildWatch.initClass();

module.exports = ModifierMyBuildWatch;
