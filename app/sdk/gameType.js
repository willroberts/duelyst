/* eslint-disable
    func-names,
    global-require,
    max-len,
    no-var,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var GameType = (function () {
  let GameFormat;
  GameType = class GameType {
    static initClass() {
      this.Ranked = 'ranked';
      this.Casual = 'casual';
      this.Gauntlet = 'gauntlet';
      this.Friendly = 'friendly';
      this.Challenge = 'challenge';
      this.Sandbox = 'sandbox';
      this.SinglePlayer = 'single_player';
      this.Rift = 'rift';
      this.BossBattle = 'boss_battle';
      this.FriendlyLegacy = 'friendly_legacy';

      GameFormat = require('./gameFormat');
    }

    static isNetworkGameType(type) {
      return (type === GameType.Ranked) || (type === GameType.Casual) || (type === GameType.Gauntlet) || (type === GameType.Friendly) || (type === GameType.SinglePlayer) || (type === GameType.BossBattle) || (type === GameType.Rift) || (type === GameType.FriendlyLegacy);
    }

    static isMultiplayerGameType(type) {
      return (type === GameType.Ranked) || (type === GameType.Casual) || (type === GameType.Gauntlet) || (type === GameType.Friendly) || (type === GameType.Rift) || (type === GameType.FriendlyLegacy);
    }

    static isSinglePlayerGameType(type) {
      return (type === GameType.SinglePlayer) || (type === GameType.BossBattle) || (type === GameType.Challenge) || (type === GameType.Sandbox);
    }

    static isLocalGameType(type) {
      return (type === GameType.Challenge) || (type === GameType.Sandbox);
    }

    static isCompetitiveGameType(type) {
      return (type === GameType.Ranked) || (type === GameType.Casual) || (type === GameType.Gauntlet) || (type === GameType.Rift);
    }

    static isFactionXPGameType(type) {
      return (type === GameType.Ranked) || (type === GameType.Casual) || (type === GameType.Gauntlet) || (type === GameType.SinglePlayer) || (type === GameType.Friendly) || (type === GameType.BossBattle) || (type === GameType.Rift) || (type === GameType.FriendlyLegacy);
    }

    static getGameFormatForGameType(type) {
      return GameFormat.Legacy;
    }
  };
  GameType.initClass();
  return GameType;
}());

module.exports = GameType;
