/* eslint-disable
    import/no-unresolved,
    no-tabs,
    no-this-before-super,
    prefer-rest-params,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Logger = 		require('app/common/logger');
const UtilsJavascript = 		require('app/common/utils/utils_javascript');
const CardType = require('app/sdk/cards/cardType');
const _ = require('underscore');
const CloneEntityAction = 		require('./cloneEntityAction');

/*
Clone an entity on the board silently as a transform.
*/

class CloneEntityAsTransformAction extends CloneEntityAction {
  static initClass() {
    this.type = 'CloneEntityAsTransformAction';
  }

  constructor() {
    if (this.type == null) { this.type = CloneEntityAsTransformAction.type; }
    super(...arguments);
  }
}
CloneEntityAsTransformAction.initClass();

module.exports = CloneEntityAsTransformAction;
