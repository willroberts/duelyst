/* eslint-disable
    import/no-unresolved,
    max-len,
    no-tabs,
    no-this-before-super,
    no-underscore-dangle,
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
const ModifierOpeningGambit = 		require('app/sdk/modifiers/modifierOpeningGambit');
const _ = require('underscore');
const ApplyCardToBoardAction = 		require('./applyCardToBoardAction');

/*
Play a card on the board and bypass the active card flow (i.e. followups and opening gambits are disabled)
*/

class PlayCardSilentlyAction extends ApplyCardToBoardAction {
  static initClass() {
    this.type = 'PlayCardSilentlyAction';
  }

  constructor() {
    if (this.type == null) { this.type = PlayCardSilentlyAction.type; }
    super(...arguments);
  }

  getCard() {
    if ((this._private.cachedCard == null)) {
      // create and cache card
      super.getCard();

      if (this._private.cachedCard != null) {
        // clear the card's followups
        this._private.cachedCard.clearFollowups();
      }
    }

    return this._private.cachedCard;
  }
}
PlayCardSilentlyAction.initClass();

module.exports = PlayCardSilentlyAction;
