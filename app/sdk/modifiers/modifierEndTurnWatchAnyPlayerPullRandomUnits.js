/* eslint-disable
    class-methods-use-this,
    consistent-return,
    import/no-unresolved,
    max-len,
    no-plusplus,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const RandomTeleportAction = require('app/sdk/actions/randomTeleportAction');
const CONFIG = require('app/common/config');
const _ = require('underscore');
const ModifierEndTurnWatchAnyPlayer = require('./modifierEndTurnWatchAnyPlayer');

class ModifierEndTurnWatchAnyPlayerPullRandomUnits extends ModifierEndTurnWatchAnyPlayer {
  static initClass() {
    this.prototype.type = 'ModifierEndTurnWatchAnyPlayerPullRandomUnits';
    this.type = 'ModifierEndTurnWatchAnyPlayerPullRandomUnits';
  }

  onTurnWatch() {
    super.onTurnWatch();

    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      const entities = this.getGameSession().getBoard().getUnits(true);
      const potentialTargets = [];
      for (const entity of Array.from(entities)) {
        if ((entity != null) && !this.positionsAreNearby(entity.getPosition(), this.getCard().getPosition())) {
          potentialTargets.push(entity);
        }
      }

      if (potentialTargets.length > 0) {
        let numTargets = 1;
        while ((Math.random() > 0.5) && (numTargets < potentialTargets.length)) {
          numTargets++;
        }
        return (() => {
          const result = [];
          for (let i = 0, end = numTargets, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
            const unitToTeleport = potentialTargets.splice(this.getGameSession().getRandomIntegerForExecution(potentialTargets.length), 1)[0];
            const randomTeleportAction = new RandomTeleportAction(this.getGameSession());
            randomTeleportAction.setOwnerId(this.getCard().getOwnerId());
            randomTeleportAction.setSource(unitToTeleport);
            randomTeleportAction.setFXResource(_.union(randomTeleportAction.getFXResource(), this.getFXResource()));
            randomTeleportAction.setPatternSourcePosition(this.getCard().getPosition());
            randomTeleportAction.setTeleportPattern(CONFIG.PATTERN_3x3);
            result.push(this.getGameSession().executeAction(randomTeleportAction));
          }
          return result;
        })();
      }
    }
  }

  positionsAreNearby(position1, position2) {
    if ((Math.abs(position1.x - position2.x) <= 1) && (Math.abs(position1.y - position2.y) <= 1)) {
      return true;
    }
    return false;
  }
}
ModifierEndTurnWatchAnyPlayerPullRandomUnits.initClass();

module.exports = ModifierEndTurnWatchAnyPlayerPullRandomUnits;
