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
const CONFIG = 		require('app/common/config');
const Logger = 		require('app/common/logger');
const CardType = require('app/sdk/cards/cardType');
const _ = require('underscore');
const ApplyCardToBoardAction = 		require('./applyCardToBoardAction');

/*
Play a card to board and allow it to enact the full play card flow (followups, spawn effects, etc)
*/

class PlayCardAction extends ApplyCardToBoardAction {
  static initClass() {
    this.type = 'PlayCardAction';
  }

  constructor() {
    if (this.type == null) { this.type = PlayCardAction.type; }
    super(...arguments);
  }
}
PlayCardAction.initClass();

module.exports = PlayCardAction;
