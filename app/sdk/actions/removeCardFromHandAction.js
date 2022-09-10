/* eslint-disable
    consistent-return,
    import/no-unresolved,
    max-len,
    no-this-before-super,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Logger = require('app/common/logger');
const CardType = require('app/sdk/cards/cardType');
const Action = require('./action');

class RemoveCardFromHandAction extends Action {
  static initClass() {
    this.type = 'RemoveCardFromHandAction';

    this.prototype.targetPlayerId = null;
    this.prototype.indexOfCardInHand = null;
  }

  constructor(gameSession, indexOfCardInHand, targetPlayerId) {
    if (this.type == null) { this.type = RemoveCardFromHandAction.type; }
    super(gameSession);

    this.indexOfCardInHand = indexOfCardInHand;
    this.targetPlayerId = targetPlayerId;
  }

  _execute() {
    super._execute();
    // Logger.module("SDK").debug "RemoveCardFromHandAction::execute"

    if (this.indexOfCardInHand != null) {
      const deck = this.getGameSession().getPlayerById(this.targetPlayerId).getDeck();
      const cardIndex = deck.getCardIndexInHandAtIndex(this.indexOfCardInHand);
      return this.getGameSession().removeCardByIndexFromHand(deck, cardIndex, this.getGameSession().getCardByIndex(cardIndex), this);
    }
  }

  getIndexOfCardInHand() {
    return this.indexOfCardInHand;
  }

  getTargetPlayerId() {
    return this.targetPlayerId;
  }
}
RemoveCardFromHandAction.initClass();

module.exports = RemoveCardFromHandAction;
