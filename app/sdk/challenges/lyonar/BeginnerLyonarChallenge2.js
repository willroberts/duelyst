/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Challenge = require("app/sdk/challenges/challenge");
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

// http://forums.duelyst.com/t/starter-challenge-1-lyonar-b/7337

class BeginnerLyonarChallenge2 extends Challenge {
	static initClass() {
	
		this.type = "BeginnerLyonarChallenge2";
		this.prototype.type = "BeginnerLyonarChallenge2";
		this.prototype.categoryType = ChallengeCategory.beginner2.type;
	
		this.prototype.name = i18next.t("challenges.beginner_lyonar_2_title");
		this.prototype.description =i18next.t("challenges.beginner_lyonar_2_description");
		this.prototype.iconUrl = RSX.speech_portrait_lyonar_side.img;
	
		this.prototype._musicOverride = RSX.music_battlemap_songhai.audio;
	
		this.prototype.otkChallengeStartMessage = i18next.t("challenges.beginner_lyonar_2_start");
		this.prototype.otkChallengeFailureMessages = [
			i18next.t("challenges.beginner_lyonar_2_fail")
		];
	
		this.prototype.battleMapTemplateIndex = 1;
		this.prototype.snapShotOnPlayerTurn = 0;
		this.prototype.startingManaPlayer = CONFIG.MAX_MANA;
	}

	getMyPlayerDeckData(gameSession){
		return [
			{id: Cards.Faction1.General},
			{id: Cards.Artifact.SunstoneBracers},
			{id: Cards.Spell.TrueStrike},
			{id: Cards.Spell.DivineBond}
		];
	}

	getOpponentPlayerDeckData(gameSession){
		return [
			{id: Cards.Faction5.General},
			{id: Cards.TutorialSpell.TutorialFireOrb}
		];
	}

	setupBoard(gameSession) {
		super.setupBoard(gameSession);

		const myPlayerId = gameSession.getMyPlayerId();
		const opponentPlayerId = gameSession.getOpponentPlayerId();

		const general1 = gameSession.getGeneralForPlayerId(myPlayerId);
		general1.setPosition({x: 2, y:2});
		general1.maxHP = 10;
		const general2 = gameSession.getGeneralForPlayerId(opponentPlayerId);
		general2.setPosition({x: 6, y: 2});
		general2.maxHP = 13;

		this.applyCardToBoard({id: Cards.Faction1.WindbladeAdept}, 4, 1, myPlayerId);
		this.applyCardToBoard({id: Cards.Faction1.IroncliffeGuardian}, 4, 3, myPlayerId);

		this.applyCardToBoard({id: Cards.Faction5.Phalanxar},3,2,opponentPlayerId);
		return this.applyCardToBoard({id: Cards.Neutral.PrimusShieldmaster},5,2,opponentPlayerId);
	}

	setupOpponentAgent(gameSession) {
		super.setupOpponentAgent(gameSession);

		this._opponentAgent.addActionForTurn(0,AgentActions.createAgentSoftActionShowInstructionLabels([{
			label:i18next.t("challenges.beginner_lyonar_2_taunt"),
			isSpeech:true,
			yPosition:.7,
			isPersistent:true,
			isOpponent: true
		}
		]));
		return this._opponentAgent.addActionForTurn(0,AgentActions.createAgentActionPlayCardFindPosition(0,() => {
			return [GameSession.getInstance().getGeneralForPlayer1().getPosition()];
		}));
	}
}
BeginnerLyonarChallenge2.initClass();


module.exports = BeginnerLyonarChallenge2;
