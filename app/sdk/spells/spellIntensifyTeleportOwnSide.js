/* eslint-disable
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
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CONFIG = require('app/common/config');
const RandomTeleportAction = require('app/sdk/actions/randomTeleportAction');
const CardType = require('app/sdk/cards/cardType');
const SpellIntensify = require('./spellIntensify');

class SpellIntensifyTeleportOwnSide extends SpellIntensify {
  onApplyOneEffectToBoard(board, x, y, sourceAction) {
    super.onApplyOneEffectToBoard(board, x, y, sourceAction);

    if (this.getGameSession().getIsRunningAsAuthoritative()) {
      const general = this.getGameSession().getGeneralForPlayerId(this.getOwnerId());
      const enemies = this.getGameSession().getBoard().getEnemyEntitiesForEntity(general, CardType.Unit, false, false);

      if (enemies != null) {
        const potentialTargets = [];
        for (const enemy of Array.from(enemies)) {
          if ((enemy != null) && !enemy.getIsGeneral() && !this.isOnMySideOfBattlefield(enemy)) {
            potentialTargets.push(enemy);
          }
        }

        if (potentialTargets.length > 0) {
          const enemiesToTeleport = [];
          const numberToTeleport = Math.min(this.getIntensifyAmount(), potentialTargets.length);
          for (let i = 0, end = numberToTeleport, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
            enemiesToTeleport.push(potentialTargets.splice(this.getGameSession().getRandomIntegerForExecution(potentialTargets.length), 1)[0]);
          }

          return (() => {
            const result = [];
            for (const teleportTarget of Array.from(enemiesToTeleport)) {
              const randomTeleportAction = new RandomTeleportAction(this.getGameSession());
              randomTeleportAction.setOwnerId(this.getOwnerId());
              randomTeleportAction.setSource(teleportTarget);
              if (this.isOwnedByPlayer1()) {
                randomTeleportAction.setPatternSourcePosition({ x: 0, y: 0 });
              } else {
                randomTeleportAction.setPatternSourcePosition({ x: Math.ceil(CONFIG.BOARDCOL * 0.5), y: 0 });
              }
              randomTeleportAction.setTeleportPattern(CONFIG.PATTERN_HALF_BOARD);
              result.push(this.getGameSession().executeAction(randomTeleportAction));
            }
            return result;
          })();
        }
      }
    }
  }

  isOnMySideOfBattlefield(unit) {
    let mySideStartX = 0;
    let mySideEndX = CONFIG.BOARDCOL;
    if (this.isOwnedByPlayer1()) {
      mySideEndX = Math.floor(((mySideEndX - mySideStartX) * 0.5) - 1);
    } else {
      mySideStartX = Math.floor(((mySideEndX - mySideStartX) * 0.5) + 1);
    }

    if ((unit.getPosition().x >= mySideStartX) && (unit.getPosition().x <= mySideEndX)) {
      return true;
    }
    return false;
  }
}

module.exports = SpellIntensifyTeleportOwnSide;
