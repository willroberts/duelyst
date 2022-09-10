/* eslint-disable
    class-methods-use-this,
    import/no-unresolved,
    max-len,
    no-tabs,
    no-underscore-dangle,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Challenge = require('app/sdk/challenges/challenge');
const Instruction 	= require('app/sdk/challenges/instruction');
const MoveAction 		= require('app/sdk/actions/moveAction');
const AttackAction 	= require('app/sdk/actions/attackAction');
const PlayCardFromHandAction = require('app/sdk/actions/playCardFromHandAction');
const EndTurnAction 	= require('app/sdk/actions/endTurnAction');
const Cards 			= require('app/sdk/cards/cardsLookupComplete');
const Deck 			= require('app/sdk/cards/deck');
const GameSession 			= require('app/sdk/gameSession');
const AgentActions = require('app/sdk/agents/agentActions');
const CONFIG = require('app/common/config');
const RSX = require('app/data/resources');
const ChallengeCategory = require('app/sdk/challenges/challengeCategory');
const i18next = require('i18next');

// http://forums.duelyst.com/t/bladedance-basic-otk-gate-5-slot-5/12316

class MediumSonghaiChallenge2 extends Challenge {
  static initClass() {
    this.type = 'MediumSonghaiChallenge2';
    this.prototype.type = 'MediumSonghaiChallenge2';
    this.prototype.categoryType = ChallengeCategory.vault2.type;

    this.prototype.name = i18next.t('challenges.medium_songhai_2_title');
    this.prototype.description = i18next.t('challenges.medium_songhai_2_description');
    this.prototype.iconUrl = RSX.speech_portrait_songhai.img;

    this.prototype._musicOverride = RSX.music_battlemap_songhai.audio;

    this.prototype.otkChallengeStartMessage = i18next.t('challenges.medium_songhai_2_start');
    this.prototype.otkChallengeFailureMessages = [
      i18next.t('challenges.medium_songhai_2_fail'),
    ];

    this.prototype.battleMapTemplateIndex = 2;
    this.prototype.snapShotOnPlayerTurn = 0;
    this.prototype.startingManaPlayer = 3;
    this.prototype.startingHandSizePlayer = 6;
  }

  getMyPlayerDeckData(gameSession) {
    return [
      { id: Cards.Faction2.General },
      { id: Cards.Neutral.PrimusFist },
      { id: Cards.Spell.InnerFocus },
      { id: Cards.Spell.SaberspineSeal },
    ];
  }

  getOpponentPlayerDeckData(gameSession) {
    return [
      { id: Cards.Faction5.General },
      { id: Cards.TutorialSpell.TutorialFireOrb },
    ];
  }

  setupBoard(gameSession) {
    super.setupBoard(gameSession);

    const myPlayerId = gameSession.getMyPlayerId();
    const opponentPlayerId = gameSession.getOpponentPlayerId();

    const general1 = gameSession.getGeneralForPlayerId(myPlayerId);
    general1.setPosition({ x: 1, y: 2 });
    general1.maxHP = 25;
    general1.setDamage(25 - 6);
    const general2 = gameSession.getGeneralForPlayerId(opponentPlayerId);
    general2.setPosition({ x: 7, y: 2 });
    general2.maxHP = 25;
    general2.setDamage(25 - 12);

    this.applyCardToBoard({ id: Cards.Neutral.DaggerKiri }, 2, 2, myPlayerId);

    this.applyCardToBoard({ id: Cards.Faction5.YoungSilithar }, 5, 2, opponentPlayerId);
    this.applyCardToBoard({ id: Cards.Faction5.EarthWalker }, 6, 3, opponentPlayerId);
    return this.applyCardToBoard({ id: Cards.Faction5.Grimrock }, 6, 1, opponentPlayerId);
  }

  setupOpponentAgent(gameSession) {
    super.setupOpponentAgent(gameSession);

    this._opponentAgent.addActionForTurn(0, AgentActions.createAgentSoftActionShowInstructionLabels([{
      label: i18next.t('challenges.medium_songhai_2_taunt'),
      isSpeech: true,
      yPosition: 0.7,
      isPersistent: true,
      isOpponent: true,
    },
    ]));
    return this._opponentAgent.addActionForTurn(0, AgentActions.createAgentActionPlayCardFindPosition(0, () => [GameSession.getInstance().getGeneralForPlayer1().getPosition()]));
  }
}
MediumSonghaiChallenge2.initClass();

module.exports = MediumSonghaiChallenge2;
