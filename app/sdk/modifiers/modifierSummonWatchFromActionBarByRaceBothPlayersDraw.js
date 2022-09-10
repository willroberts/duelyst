/* eslint-disable
    import/no-unresolved,
    max-len,
    no-plusplus,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const DrawCardAction = require('app/sdk/actions/drawCardAction');
const ModifierSummonWatchFromActionBar = require('./modifierSummonWatchFromActionBar');

class ModifierSummonWatchFromActionBarByRaceBothPlayersDraw extends ModifierSummonWatchFromActionBar {
  static initClass() {
    this.prototype.type = 'ModifierSummonWatchFromActionBarByRaceBothPlayersDraw';
    this.type = 'ModifierSummonWatchFromActionBarByRaceBothPlayersDraw';

    this.prototype.targetRaceId = null;
    this.prototype.drawAmount = 1;
  }

  static createContextObject(targetRaceId, drawAmount, options) {
    const contextObject = super.createContextObject(options);
    contextObject.targetRaceId = targetRaceId;
    contextObject.drawAmount = drawAmount;
    return contextObject;
  }

  onSummonWatch(action) {
    return (() => {
      const result = [];
      for (let x = 1, end = this.drawAmount, asc = end >= 1; asc ? x <= end : x >= end; asc ? x++ : x--) {
        const general = this.getCard().getGameSession().getGeneralForPlayerId(this.getCard().getOwnerId());
        this.getGameSession().executeAction(new DrawCardAction(this.getGameSession(), general.getOwnerId()));

        const enemyGeneral = this.getCard().getGameSession().getGeneralForOpponentOfPlayerId(this.getCard().getOwnerId());
        result.push(this.getGameSession().executeAction(new DrawCardAction(this.getGameSession(), enemyGeneral.getOwnerId())));
      }
      return result;
    })();
  }

  getIsCardRelevantToWatcher(card) {
    return card.getBelongsToTribe(this.targetRaceId);
  }
}
ModifierSummonWatchFromActionBarByRaceBothPlayersDraw.initClass();

module.exports = ModifierSummonWatchFromActionBarByRaceBothPlayersDraw;
