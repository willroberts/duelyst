/* eslint-disable
    class-methods-use-this,
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
const StopBufferingEventsAction = 		require('./stopBufferingEventsAction');

class EndFollowupAction extends StopBufferingEventsAction {
  static initClass() {
    this.type = 'EndFollowupAction';
  }

  constructor() {
    if (this.type == null) { this.type = EndFollowupAction.type; }
    super(...arguments);
  }

  isRemovableDuringScrubbing() {
    return false;
  }
}
EndFollowupAction.initClass();

module.exports = EndFollowupAction;
