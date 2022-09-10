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
const ModifierOpeningGambitBuffSelfByShadowTileCount = require('app/sdk/modifiers/modifierOpeningGambitBuffSelfByShadowTileCount');
const i18next = require('i18next');

// http://forums.duelyst.com/t/bad-to-the-bone-gate-2-slot-4/14483

class BeginnerVetruvianChallenge5 extends Challenge {
  static initClass() {
    this.type = 'BeginnerVetruvianChallenge5';
    this.prototype.type = 'BeginnerVetruvianChallenge5';
    this.prototype.categoryType = ChallengeCategory.starter.type;

    this.prototype.name = i18next.t('challenges.beginner_vetruvian_5_title');
    this.prototype.description = i18next.t('challenges.beginner_vetruvian_5_description');
    this.prototype.iconUrl = RSX.speech_portrait_vetruvian.img;

    this.prototype._musicOverride = RSX.music_battlemap_vetruv.audio;

    this.prototype.otkChallengeStartMessage = i18next.t('challenges.beginner_vetruvian_5_start');
    this.prototype.otkChallengeFailureMessages = [
      i18next.t('challenges.beginner_vetruvian_5_fail'),
    ];

    this.prototype.battleMapTemplateIndex = 0;
    this.prototype.snapShotOnPlayerTurn = 0;
    this.prototype.startingManaPlayer = 9;
    this.prototype.startingHandSizePlayer = 4;
  }

  getMyPlayerDeckData(gameSession) {
    return [
      { id: Cards.Faction3.General },
      { id: Cards.Neutral.DancingBlades },
      { id: Cards.Neutral.EphemeralShroud },
    ];
  }

  getOpponentPlayerDeckData(gameSession) {
    return [
      { id: Cards.Faction6.General },
      { id: Cards.TutorialSpell.TutorialFireOrb },
    ];
  }

  setupBoard(gameSession) {
    super.setupBoard(gameSession);

    const myPlayerId = gameSession.getMyPlayerId();
    const opponentPlayerId = gameSession.getOpponentPlayerId();

    const general1 = gameSession.getGeneralForPlayerId(myPlayerId);
    general1.setPosition({ x: 2, y: 2 });
    general1.maxHP = 25;
    general1.setDamage(25 - 15);
    const general2 = gameSession.getGeneralForPlayerId(opponentPlayerId);
    general2.setPosition({ x: 5, y: 2 });
    general2.maxHP = 25;
    general2.setDamage(25 - 2);

    this.applyCardToBoard({ id: Cards.Faction6.FenrirWarmaster }, 4, 2, opponentPlayerId);
    this.applyCardToBoard({ id: Cards.Faction6.BonechillBarrier }, 5, 1, opponentPlayerId);
    this.applyCardToBoard({ id: Cards.Faction6.BonechillBarrier }, 5, 3, opponentPlayerId);
    return this.applyCardToBoard({ id: Cards.Faction6.BonechillBarrier }, 6, 2, opponentPlayerId);
  }

  setupOpponentAgent(gameSession) {
    super.setupOpponentAgent(gameSession);

    this._opponentAgent.addActionForTurn(0, AgentActions.createAgentSoftActionShowInstructionLabels([{
      label: i18next.t('challenges.beginner_vetruvian_5_taunt'),
      isSpeech: true,
      isPersistent: true,
      yPosition: 0.6,
      isOpponent: true,
    },
    ]));
    return this._opponentAgent.addActionForTurn(0, AgentActions.createAgentActionPlayCardFindPosition(0, () => [GameSession.getInstance().getGeneralForPlayer1().getPosition()]));
  }
}
BeginnerVetruvianChallenge5.initClass();

module.exports = BeginnerVetruvianChallenge5;
