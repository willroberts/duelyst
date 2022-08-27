var path = require('path')
require('app-module-path').addPath(path.join(__dirname, '../../../../../../'))
require('coffee-script/register')
var expect = require('chai').expect;
var CONFIG = require('app/common/config');
var Logger = require('app/common/logger');
var SDK = require('app/sdk');
var UtilsSDK = require('test/utils/utils_sdk');
var _ = require('underscore');

// disable the logger for cleaner test output
Logger.enabled = false;

describe("faction5", function() {
	describe("spells", function(){

		beforeEach(function () {
			// define test decks.  Spells do not work.  Only add minions and generals this way
			var player1Deck = [
				{id: SDK.Cards.Faction5.General},
			];

			var player2Deck = [
				{id: SDK.Cards.Faction2.General},
			];

			// setup test session
			UtilsSDK.setupSession(player1Deck, player2Deck, true, true);

			/* // USE THIS TO GET THE CURRENT CARDS IN YOUR HAND
			var deck = player1.getDeck();
			Logger.module("UNITTEST").log(deck.getCardsInHand(1));
			*/
		});

		afterEach(function () {
			SDK.GameSession.reset();
		});

		it('expect amplification to give friendly damaged minion +2/+4', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer1Id());

			earthwalker.setDamage(1);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.Amplification}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(earthwalker.getATK()).to.equal(5);
			expect(earthwalker.getHP()).to.equal(6);
		});
		it('expect amplification cannot be cast on minion with full health', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer1Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.Amplification}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(earthwalker.getATK()).to.equal(3);
			expect(earthwalker.getHP()).to.equal(3);
		});
		it('expect dampening wave to take away counter attacking from a minion', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			var youngSilithar = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.YoungSilithar}, 0, 1, gameSession.getPlayer2Id());
			var abyssalCrawler1 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction4.AbyssalCrawler}, 1, 1, gameSession.getPlayer1Id());
			abyssalCrawler1.refreshExhaustion();

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.DampeningWave}));
			UtilsSDK.executeActionWithoutValidation(player1.actionPlayCardFromHand(0, 0, 1));

			var action = abyssalCrawler1.actionAttack(youngSilithar);
			gameSession.executeAction(action);

			expect(abyssalCrawler1.getHP()).to.equal(1);
		});
		it('expect flash reincarnation to reduce next minion summoned by 2 and will take 2 damage', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.FlashReincarnation}));
			UtilsSDK.executeActionWithoutValidation(player1.actionPlayCardFromHand(0, 0, 1));

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Faction4.SpectralRevenant}));
			var hand = player1.getDeck().getCardsInHand();
			var cardDraw = hand[0];
			expect(cardDraw.getBaseCardId()).to.equal(SDK.Cards.Faction4.SpectralRevenant);
			expect(cardDraw.getManaCost()).to.equal(6);

			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 2);
			gameSession.executeAction(playCardFromHandAction);

			var revenant = board.getUnitAtPosition({x:1,y:2});
			expect(revenant.getHP()).to.equal(4);
		});
		it('expect flash reincarnation effect to not persist after minion summoned', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.FlashReincarnation}));
			UtilsSDK.executeActionWithoutValidation(player1.actionPlayCardFromHand(0, 0, 1));

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Faction4.SpectralRevenant}));
			var hand = player1.getDeck().getCardsInHand();
			var cardDraw = hand[0];
			expect(cardDraw.getBaseCardId()).to.equal(SDK.Cards.Faction4.SpectralRevenant);
			expect(cardDraw.getManaCost()).to.equal(6);

			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 2);
			gameSession.executeAction(playCardFromHandAction);

			var revenant = board.getUnitAtPosition({x:1,y:2});
			expect(revenant.getHP()).to.equal(4);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Faction4.SpectralRevenant}));
			var hand = player1.getDeck().getCardsInHand();
			var cardDraw = hand[0];
			expect(cardDraw.getBaseCardId()).to.equal(SDK.Cards.Faction4.SpectralRevenant);
			expect(cardDraw.getManaCost()).to.equal(8);
		});
		it('expect flash reincarnation effect to not persist after you end a turn', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.FlashReincarnation}));
			UtilsSDK.executeActionWithoutValidation(player1.actionPlayCardFromHand(0, 0, 1));

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Faction4.SpectralRevenant}));
			var hand = player1.getDeck().getCardsInHand();
			var cardDraw = hand[0];
			expect(cardDraw.getBaseCardId()).to.equal(SDK.Cards.Faction4.SpectralRevenant);
			expect(cardDraw.getManaCost()).to.equal(6);

			gameSession.executeAction(gameSession.actionEndTurn());
			gameSession.executeAction(gameSession.actionEndTurn());

			expect(cardDraw.getBaseCardId()).to.equal(SDK.Cards.Faction4.SpectralRevenant);
			expect(cardDraw.getManaCost()).to.equal(8);
		});
		it('expect greater fortitude to give friendly minion +2/+2', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer1Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.GreaterFortitude}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(earthwalker.getATK()).to.equal(5);
			expect(earthwalker.getHP()).to.equal(5);
		});
		it('expect diretide frenzy to give minion +1 attack and frenzy', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer1Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.DiretideFrenzy}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(earthwalker.getATK()).to.equal(4);
			expect(earthwalker.hasModifierClass(SDK.ModifierFrenzy)).to.equal(true);
		});
		it('expect dance of dreams to draw a card every time a friendly minion dies this turn', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 3, 0, gameSession.getPlayer1Id());
			var earthwalker2 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 4, 0, gameSession.getPlayer1Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInDeckAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.EggMorph}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInDeckAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.EggMorph}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.DanceOfDreams}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 0, 2);
			gameSession.executeAction(playCardFromHandAction);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 3, 0);
			gameSession.executeAction(playCardFromHandAction);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(1, 4, 0);
			gameSession.executeAction(playCardFromHandAction);

			var hand = player1.getDeck().getCardsInHand();

			expect(hand[0].getBaseCardId()).to.equal(SDK.Cards.Spell.EggMorph);
			expect(hand[1].getBaseCardId()).to.equal(SDK.Cards.Spell.EggMorph);
		});
		it('expect natural selection to destroy the minion with the lowest attack', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer2Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.NaturalSelection}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(earthwalker.getIsRemoved()).to.equal(true);
		});
		it('expect natural selection to not be castable on minion that does not have lowest attack', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer1Id());
			var veteranSilithar = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 2, 1, gameSession.getPlayer2Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.NaturalSelection}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 2, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(veteranSilithar.getIsRemoved()).to.equal(false);
		});
		it('expect tremor to stun enemy minions in 2x2 grid', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer2Id());
			var veteranSilithar = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 0, 0, gameSession.getPlayer2Id());
			var veteranSilithar2 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 1, 0, gameSession.getPlayer2Id());
			var veteranSilithar3 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 0, 1, gameSession.getPlayer2Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.Tremor}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 0, 0);
			gameSession.executeAction(playCardFromHandAction);

			expect(earthwalker.hasActiveModifierClass(SDK.ModifierStunned)).to.equal(true);
			expect(veteranSilithar.hasActiveModifierClass(SDK.ModifierStunned)).to.equal(true);
			expect(veteranSilithar2.hasActiveModifierClass(SDK.ModifierStunned)).to.equal(true);
			expect(veteranSilithar3.hasActiveModifierClass(SDK.ModifierStunned)).to.equal(true);
		});

		/* Broken test
		it('expect kinetic equilibrium to deal 2 damage to all minions in 3x3 grid', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer1Id());
			var veteranSilithar = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 0, 0, gameSession.getPlayer2Id());
			var veteranSilithar2 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 1, 0, gameSession.getPlayer1Id());
			var veteranSilithar3 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 0, 1, gameSession.getPlayer2Id());
			var veteranSilithar4 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 2, 2, gameSession.getPlayer1Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.KineticEquilibrium}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(earthwalker.getHP()).to.equal(1);
			expect(veteranSilithar.getHP()).to.equal(1);
			expect(veteranSilithar2.getHP()).to.equal(1);
			expect(veteranSilithar3.getHP()).to.equal(1);
			expect(veteranSilithar4.getHP()).to.equal(1);
		});
		*/

		it('expect kinetic equilibrium to give all friendly minions in 3x3 grid +2 attack', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer1Id());
			var veteranSilithar = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 0, 0, gameSession.getPlayer2Id());
			var veteranSilithar2 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 1, 0, gameSession.getPlayer1Id());
			var veteranSilithar3 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 0, 1, gameSession.getPlayer2Id());
			var veteranSilithar4 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 2, 2, gameSession.getPlayer1Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.KineticEquilibrium}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(earthwalker.getATK()).to.equal(5);
			expect(veteranSilithar.getATK()).to.equal(4);
			expect(veteranSilithar2.getATK()).to.equal(6);
			expect(veteranSilithar3.getATK()).to.equal(4);
			expect(veteranSilithar4.getATK()).to.equal(6);
		});
		it('expect chrysallis burst to spawn 4 random eggs (1 of each rarity) in 4 random spots', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.ChrysalisBloom}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			var unitArray = board.getUnits();
			var totalRarity = 0;

			var eggModifier1 = unitArray[2].getActiveModifierByClass(SDK.ModifierEgg);
			var eggModifier2 = unitArray[3].getActiveModifierByClass(SDK.ModifierEgg);
			var eggModifier3 = unitArray[4].getActiveModifierByClass(SDK.ModifierEgg);
			var eggModifier4 = unitArray[5].getActiveModifierByClass(SDK.ModifierEgg);

			var spawningCard1 = gameSession.getCardCaches().getCardById(eggModifier1.cardDataOrIndexToSpawn.id);
			var spawningCardRarity1 = spawningCard1.getRarityId();
			var spawningCard2 = gameSession.getCardCaches().getCardById(eggModifier2.cardDataOrIndexToSpawn.id);
			var spawningCardRarity2 = spawningCard2.getRarityId();
			var spawningCard3 = gameSession.getCardCaches().getCardById(eggModifier3.cardDataOrIndexToSpawn.id);
			var spawningCardRarity3 = spawningCard3.getRarityId();
			var spawningCard4 = gameSession.getCardCaches().getCardById(eggModifier4.cardDataOrIndexToSpawn.id);
			var spawningCardRarity4 = spawningCard4.getRarityId();

			totalRarity = spawningCardRarity1 + spawningCardRarity2 + spawningCardRarity3 + spawningCardRarity4;

			expect(totalRarity).to.equal(10);
		});

		/* Slow test
		it('expect chrysalis burst eggs to hatch before owner\'s next turn', function() {
			this.timeout(50000);
			for(var i = 0; i < 50; i++) {
				var player1Deck = [
					{id: SDK.Cards.Faction6.General}
				];

				var player2Deck = [
					{id: SDK.Cards.Faction6.General}
				];

				// setup test session
				UtilsSDK.setupSession(player1Deck, player2Deck, true, true);

				var gameSession = SDK.GameSession.getInstance();
				var board = gameSession.getBoard();
				var player1 = gameSession.getPlayer1();

				player1.remainingMana = 9;

				UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.ChrysalisBloom}));
				var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
				gameSession.executeAction(playCardFromHandAction);

				var unitArray = board.getUnits();
				expect(unitArray[2].getId()).to.equal(SDK.Cards.Faction5.Egg);
				expect(unitArray[3].getId()).to.equal(SDK.Cards.Faction5.Egg);
				expect(unitArray[4].getId()).to.equal(SDK.Cards.Faction5.Egg);
				expect(unitArray[5].getId()).to.equal(SDK.Cards.Faction5.Egg);
				var indexEgg1 = unitArray[2].getIndex();
				var indexEgg2 = unitArray[3].getIndex();
				var indexEgg3 = unitArray[4].getIndex();
				var indexEgg4 = unitArray[5].getIndex();

				gameSession.executeAction(gameSession.actionEndTurn());
				gameSession.executeAction(gameSession.actionEndTurn());

				// possible for units spawned from eggs to die due to other units spawned from eggs (ex: spirit harvester)
				var unitArray = board.getUnits();
				if (unitArray.length === 5) {
					expect(unitArray[2].getIndex()).to.not.equal(indexEgg1);
					expect(unitArray[3].getIndex()).to.not.equal(indexEgg2);
					expect(unitArray[4].getIndex()).to.not.equal(indexEgg3);
					expect(unitArray[5].getIndex()).to.not.equal(indexEgg4);
				}
			}
		});
		*/

		it('expect earth sphere to restore 8 health to your general', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;
			gameSession.getGeneralForPlayer1().setDamage(10);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.EarthSphere}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(gameSession.getGeneralForPlayer1().getHP()).to.equal(23);
		});
		it('expect egg morph to transform a minion into an egg', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;
			gameSession.getGeneralForPlayer1().setDamage(10);

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer2Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.EggMorph}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			var egg = board.getUnitAtPosition({x:1,y:1});
			expect(egg.getId()).to.equal(SDK.Cards.Faction5.Egg);
		});
		it('expect egg morph to transform an egg into a hatched minion', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer2Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.EggMorph}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.EggMorph}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			var earthwalker = board.getUnitAtPosition({x:1,y:1});
			expect(earthwalker.getId()).to.equal(SDK.Cards.Faction5.EarthWalker);
		});
		it('expect mind steal to summon a minion from the enemys deck under your control', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInDeckAction(gameSession, gameSession.getPlayer2Id(), {id: SDK.Cards.Faction5.EarthWalker}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.MindSteal}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			var earthwalker = board.getUnitAtPosition({x:1,y:1});
			expect(earthwalker.getId()).to.equal(SDK.Cards.Faction5.EarthWalker);
		});
		it('expect mind steal to remove that minion from the enemys deck', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInDeckAction(gameSession, gameSession.getPlayer2Id(), {id: SDK.Cards.Faction5.EarthWalker}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.MindSteal}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			var cardsToDraw = player2.getDeck().getCardsInDrawPile();

			var earthwalker = board.getUnitAtPosition({x:1,y:1});
			expect(earthwalker.getId()).to.equal(SDK.Cards.Faction5.EarthWalker);
			expect(cardsToDraw[0]).to.equal(undefined);
		});
		it('expect mind steal to not do anything if enemy has no minions left in deck', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.MindSteal}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			var earthwalker = board.getUnitAtPosition({x:1,y:1});
			expect(earthwalker).to.equal(undefined);
		});
		it('expect metamorphosis to turn all enemy minions into 1/1 magma until end of opponents next turn', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer2Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.Metamorphosis}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			var earthwalker = board.getUnitAtPosition({x:1,y:1});
			expect(earthwalker.getId()).to.equal(SDK.Cards.Faction5.MiniMagmar);

			gameSession.executeAction(gameSession.actionEndTurn());
			gameSession.executeAction(gameSession.actionEndTurn());

			var earthwalker = board.getUnitAtPosition({x:1,y:1});
			expect(earthwalker.getId()).to.equal(SDK.Cards.Faction5.EarthWalker);
		});
		it('expect metamorphosis to return the transformed enemies back to a fresh copy of the minion with no buffs or debuffs', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer2Id());

			gameSession.executeAction(gameSession.actionEndTurn());
			player2.remainingMana = 9;
			earthwalker.setDamage(1);
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer2Id(), {id: SDK.Cards.Spell.Amplification}));
			var playCardFromHandAction = player2.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			gameSession.executeAction(gameSession.actionEndTurn());

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.Metamorphosis}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			var earthwalker = board.getUnitAtPosition({x:1,y:1});
			expect(earthwalker.getId()).to.equal(SDK.Cards.Faction5.MiniMagmar);

			gameSession.executeAction(gameSession.actionEndTurn());
			gameSession.executeAction(gameSession.actionEndTurn());

			var earthwalker = board.getUnitAtPosition({x:1,y:1});
			expect(earthwalker.getId()).to.equal(SDK.Cards.Faction5.EarthWalker);
			expect(earthwalker.getHP()).to.equal(3);
			expect(earthwalker.getATK()).to.equal(3);
		});
		it('expect plasma storm to kill all friendly and enemy minions with only 3 attack or lower', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer2Id());
			var veteranSilithar = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.VeteranSilithar}, 2, 1, gameSession.getPlayer2Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PlasmaStorm}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(earthwalker.getIsRemoved()).to.equal(true);
			expect(veteranSilithar.getIsRemoved()).to.equal(false);
		});
		it('expect fractal replication to create 2 copies of a unit with damage and buffs retained', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			var earthwalker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.EarthWalker}, 1, 1, gameSession.getPlayer1Id());

			earthwalker.setDamage(1);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.Amplification}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(earthwalker.getATK()).to.equal(5);
			expect(earthwalker.getHP()).to.equal(6);

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.FractalReplication}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);
			var followupCard = playCardFromHandAction.getCard().getCurrentFollowupCard();
			var followupAction = player1.actionPlayFollowup(followupCard, 1, 2);
			gameSession.executeAction(followupAction);
			var followupCard = playCardFromHandAction.getCard().getCurrentFollowupCard();
			var followupAction = player1.actionPlayFollowup(followupCard, 2, 1);
			gameSession.executeAction(followupAction);

			var earthwalker2 = board.getUnitAtPosition({x: 1, y: 2});
			var earthwalker3 = board.getUnitAtPosition({x: 2, y: 1});

			expect(earthwalker2.getATK()).to.equal(5);
			expect(earthwalker2.getHP()).to.equal(6);
			expect(earthwalker3.getATK()).to.equal(5);
			expect(earthwalker3.getHP()).to.equal(6);
		});
		it('expect bounded lifeforce to turn general into 10/10', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.BoundedLifeforce}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(gameSession.getGeneralForPlayer1().getATK()).to.equal(10);
			expect(gameSession.getGeneralForPlayer1().getHP()).to.equal(10);
		});
		it('expect bounded lifeforce to make you unable to heal past 10 health', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.BoundedLifeforce}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(gameSession.getGeneralForPlayer1().getHP()).to.equal(10);

			player1.remainingMana = 9;
			gameSession.getGeneralForPlayer1().setDamage(2);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.EarthSphere}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(gameSession.getGeneralForPlayer1().getHP()).to.equal(10);
		});
		it('expect bounded lifeforce to not be dispelable', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.BoundedLifeforce}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(gameSession.getGeneralForPlayer1().getHP()).to.equal(10);

			gameSession.executeAction(gameSession.actionEndTurn());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer2Id(), {id: SDK.Cards.Spell.ChromaticCold}));
			var playCardFromHandAction = player2.actionPlayCardFromHand(0, 0, 2);
			gameSession.executeAction(playCardFromHandAction);

			expect(gameSession.getGeneralForPlayer1().getHP()).to.equal(9);
			expect(gameSession.getGeneralForPlayer1().getATK()).to.equal(10);
		});
		it('expect bounded lifeforce to preserve artifact buffs', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Artifact.AdamantineClaws}));
			UtilsSDK.executeActionWithoutValidation(player1.actionPlayCardFromHand(0, 1, 1));

			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.BoundedLifeforce}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(gameSession.getGeneralForPlayer1().getATK()).to.equal(14);
			expect(gameSession.getGeneralForPlayer1().getHP()).to.equal(10);
		});
	});  //end Spells describe

});
