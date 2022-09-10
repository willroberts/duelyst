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
const _ = require('underscore');
const PlayCardSilentlyAction = 		require('./playCardSilentlyAction');

/*
	Play a card to board as a transform.
*/

class PlayCardAsTransformAction extends PlayCardSilentlyAction {
  static initClass() {
    this.type = 'PlayCardAsTransformAction';
  }

  constructor() {
    if (this.type == null) { this.type = PlayCardAsTransformAction.type; }
    super(...arguments);
  }
}
PlayCardAsTransformAction.initClass();

module.exports = PlayCardAsTransformAction;
