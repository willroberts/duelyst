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
const ModifierSummonWatchByEntityBuffSelf = require('app/sdk/modifiers/modifierSummonWatchByEntityBuffSelf');
const i18next = require('i18next');

// http://forums.duelyst.com/t/gifts-ungiven-basic-otk-gate-2-slot-3/12429

class BeginnerAbyssianChallenge6 extends Challenge {
  static initClass() {
    this.type = 'BeginnerAbyssianChallenge6';
    this.prototype.type = 'BeginnerAbyssianChallenge6';
    this.prototype.categoryType = ChallengeCategory.starter.type;

    this.prototype.name = i18next.t('challenges.beginner_abyss_6_title');
    this.prototype.description = i18next.t('challenges.beginner_abyss_6_description');
    this.prototype.iconUrl = RSX.speech_portrait_abyssian.img;

    this.prototype._musicOverride = RSX.music_battlemap_abyssian.audio;

    this.prototype.otkChallengeStartMessage = i18next.t('challenges.beginner_abyss_6_start');
    this.prototype.otkChallengeFailureMessages = [
      i18next.t('challenges.beginner_abyss_6_fail'),
    ];

    this.prototype.battleMapTemplateIndex = 2;
    this.prototype.snapShotOnPlayerTurn = 0;
    this.prototype.startingManaPlayer = 9;
    this.prototype.startingHandSizePlayer = 6;
  }

  getMyPlayerDeckData(gameSession) {
    return [
      { id: Cards.Faction4.General },
      { id: Cards.Spell.CurseOfAgony },
      { id: Cards.Spell.DaemonicLure },
    ];
  }

  getOpponentPlayerDeckData(gameSession) {
    return [
      { id: Cards.Faction3.General },
      { id: Cards.TutorialSpell.TutorialFireOrb },
    ];
  }

  setupBoard(gameSession) {
    super.setupBoard(gameSession);

    const myPlayerId = gameSession.getMyPlayerId();
    const opponentPlayerId = gameSession.getOpponentPlayerId();

    const general1 = gameSession.getGeneralForPlayerId(myPlayerId);
    general1.setPosition({ x: 1, y: 1 });
    general1.maxHP = 25;
    general1.setDamage(25 - 6);
    const general2 = gameSession.getGeneralForPlayerId(opponentPlayerId);
    general2.setPosition({ x: 5, y: 2 });
    general2.maxHP = 25;
    general2.setDamage(25 - 3);

    this.applyCardToBoard({ id: Cards.Faction3.Pyromancer }, 3, 2, opponentPlayerId);
    this.applyCardToBoard({ id: Cards.Faction3.SandHowler }, 4, 1, opponentPlayerId);
    this.applyCardToBoard({ id: Cards.Faction3.SandHowler }, 4, 3, opponentPlayerId);
    return this.applyCardToBoard({ id: Cards.Neutral.KomodoCharger }, 7, 3, opponentPlayerId);
  }

  setupOpponentAgent(gameSession) {
    super.setupOpponentAgent(gameSession);

    this._opponentAgent.addActionForTurn(0, AgentActions.createAgentSoftActionShowInstructionLabels([{
      label: i18next.t('challenges.beginner_abyss_6_taunt'),
      isSpeech: true,
      isPersistent: true,
      yPosition: 0.6,
      isOpponent: true,
    },
    ]));
    return this._opponentAgent.addActionForTurn(0, AgentActions.createAgentActionPlayCardFindPosition(0, () => [GameSession.getInstance().getGeneralForPlayer1().getPosition()]));
  }
}
BeginnerAbyssianChallenge6.initClass();

module.exports = BeginnerAbyssianChallenge6;
