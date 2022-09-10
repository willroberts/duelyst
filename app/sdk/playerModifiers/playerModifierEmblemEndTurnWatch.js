/* eslint-disable
    class-methods-use-this,
    consistent-return,
    import/no-unresolved,
    max-len,
    no-param-reassign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const EndTurnAction = require('app/sdk/actions/endTurnAction');
const PlayerModifierEmblem = require('./playerModifierEmblem');

class PlayerModifierEmblemEndTurnWatch extends PlayerModifierEmblem {
  static initClass() {
    this.prototype.type = 'PlayerModifierEmblemEndTurnWatch';
    this.type = 'PlayerModifierEmblemEndTurnWatch';

    this.prototype.activeInHand = false;
    this.prototype.activeInDeck = false;
    this.prototype.activeInSignatureCards = false;
    this.prototype.activeOnBoard = true;

    this.prototype.fxResource = ['FX.Modifiers.ModifierEndTurnWatch'];

    this.prototype.activeOnMyTurn = true;
    this.prototype.activeOnEnemyTurn = false;
  }

  static createContextObject(activeOnMyTurn, activeOnEnemyTurn, options) {
    if (activeOnMyTurn == null) { activeOnMyTurn = true; }
    if (activeOnEnemyTurn == null) { activeOnEnemyTurn = false; }
    const contextObject = super.createContextObject(options);
    contextObject.activeOnMyTurn = activeOnMyTurn;
    contextObject.activeOnEnemyTurn = activeOnEnemyTurn;
    return contextObject;
  }

  onActivate() {
    super.onActivate();
    // trigger when applied during end of turn
    // but only if this was not applied as a result of the card being played
    if (this.getGameSession().getCurrentTurn().getEnded()) {
      const executingAction = this.getGameSession().getExecutingAction();
      const endTurnAction = executingAction.getMatchingAncestorAction(EndTurnAction);
      if (endTurnAction != null) {
        const playedByAction = this.getCard().getAppliedToBoardByAction();
        if ((playedByAction == null)) {
          return this.onTurnWatch(endTurnAction);
        } if (playedByAction.getIndex() < endTurnAction.getIndex()) {
          return this.onTurnWatch(executingAction);
        }
      }
    }
  }

  onEndTurn(e) {
    super.onEndTurn(e);
    if ((this.activeOnMyTurn && (this.getGameSession().getCurrentPlayer().getPlayerId() === this.getCard().getOwnerId())) || (this.activeOnEnemyTurn && (this.getGameSession().getCurrentPlayer().getPlayerId() !== this.getCard().getOwnerId()))) {
      return this.onTurnWatch(this.getGameSession().getExecutingAction());
    }
  }

  onTurnWatch(action) {}
}
PlayerModifierEmblemEndTurnWatch.initClass();
// override me in sub classes to implement special behavior

module.exports = PlayerModifierEmblemEndTurnWatch;
