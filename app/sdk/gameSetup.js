/* eslint-disable
    consistent-return,
    func-names,
    import/extensions,
    import/no-unresolved,
    max-len,
    no-param-reassign,
    no-plusplus,
    no-restricted-syntax,
    no-return-assign,
    no-tabs,
    prefer-destructuring,
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
const Logger = require('app/common/logger');
const UtilsJavascript = require('app/common/utils/utils_javascript');
const ModifierStartsInHand = require('app/sdk/modifiers/modifierStartsInHand');
const _ = require('underscore');
const GameType = require('./gameType');
const PlayCardSilentlyAction = require('./actions/playCardSilentlyAction');
const Entity = require('./entities/entity');
const Cards = require('./cards/cardsLookupComplete');
const BattleMapTemplate = require('./battleMapTemplate');
const CosmeticsFactory = require('./cosmetics/cosmeticsFactory');

const GameSetup = {};

// region SETUP NEW

/**
 * Initialize new game session object with the correct data
 * @public
 * @param gameSession
 * @param player1Data
 * @param player2Data
 * @example
 * playerData should contain:
 *		userId: String
 *		name: String
 *		deck: Array of [{ id: Integer }]
 */
GameSetup.setupNewSession = function (gameSession, player1Data, player2Data, withoutManaTiles) {
  if (withoutManaTiles == null) { withoutManaTiles = false; }
  if (gameSession != null) {
    // Logger.module("SDK").debug("[G:#{gameSession.gameId}]", "GameSetup.setupNewSession", player1Data, player2Data)
    // Logger.module("SDK").debug("GameSetup: player 1 battlemap indexes -> #{player1Data.battleMapIndexes}")

    // get players
    let battemapTemplateIndex; let general1X; let general1Y; let general2X; let
      general2Y;
    const player1 = gameSession.getPlayer1();
    const player2 = gameSession.getPlayer2();

    // setup basics
    GameSetup.setupPlayerBasics(gameSession, player1, player1Data);
    GameSetup.setupPlayerBasics(gameSession, player2, player2Data);

    // first card from the deck should always be the general
    const general1CardData = UtilsJavascript.deepCopy(player1Data.deck[0]);
    const general2CardData = UtilsJavascript.deepCopy(player2Data.deck[0]);

    // always setup general before decks or cards
    const general1 = GameSetup.createGeneral(gameSession, player1, general1CardData);
    const general2 = GameSetup.createGeneral(gameSession, player2, general2CardData);

    if (general1.getBossBattleBattleMapIndex() != null) {
      battemapTemplateIndex = general1.getBossBattleBattleMapIndex();
      Logger.module('SDK').debug(`GameSetup: player 1 boss battlemap index -> ${battemapTemplateIndex}`);
      gameSession.battleMapTemplate = new BattleMapTemplate(gameSession, battemapTemplateIndex);
    } else if (general2.getBossBattleBattleMapIndex() != null) {
      battemapTemplateIndex = general2.getBossBattleBattleMapIndex();
      Logger.module('SDK').debug(`GameSetup: player 2 boss battlemap index -> ${battemapTemplateIndex}`);
      gameSession.battleMapTemplate = new BattleMapTemplate(gameSession, battemapTemplateIndex);
    } else if (player1Data.battleMapIndexes != null) {
      battemapTemplateIndex = _.sample(player1Data.battleMapIndexes);
      Logger.module('SDK').debug(`GameSetup: player 1 battlemap index -> ${battemapTemplateIndex}`);
      gameSession.battleMapTemplate = new BattleMapTemplate(gameSession, battemapTemplateIndex);
    }

    // setup decks
    GameSetup.setupDeck(gameSession, player1);
    GameSetup.setupDeck(gameSession, player2);

    // always add general before adding cards but after setting up deck
    // because general may attempt to access deck and cards may attempt to add modifiers to the general
    const general1Position = player1Data.startingGeneralPosition;
    if (general1Position != null) {
      general1X = general1Position.x;
      general1Y = general1Position.y;
    }
    if ((general1X == null)) { general1X = 0; }
    if ((general1Y == null)) { general1Y = 2; }
    GameSetup.addGeneral(gameSession, player1, general1, general1X, general1Y);

    const general2Position = player2Data.startingGeneralPosition;
    if (general2Position != null) {
      general2X = general2Position.x;
      general2Y = general2Position.y;
    }
    if ((general2X == null)) { general2X = 8; }
    if ((general2Y == null)) { general2Y = 2; }
    GameSetup.addGeneral(gameSession, player2, general2, general2X, general2Y);

    // setup cards in decks and hands
    GameSetup.addCardsToDeck(gameSession, player1, player1Data, player1Data.deck);
    GameSetup.addCardsToDeck(gameSession, player2, player2Data, player2Data.deck);

    if (!withoutManaTiles) {
      // create and apply special tiles
      gameSession.applyCardToBoard(gameSession.getExistingCardFromIndexOrCreateCardFromData({ id: Cards.Tile.BonusMana }), 4, 0);
      gameSession.applyCardToBoard(gameSession.getExistingCardFromIndexOrCreateCardFromData({ id: Cards.Tile.BonusMana }), 4, 4);
      gameSession.applyCardToBoard(gameSession.getExistingCardFromIndexOrCreateCardFromData({ id: Cards.Tile.BonusMana }), 5, 2);
    }

    GameSetup.addCardsToBoard(gameSession, player1Data.startingBoardCardsData, player1);
    GameSetup.addCardsToBoard(gameSession, player2Data.startingBoardCardsData, player2);

    // store game setup data for things like replays
    // this way game can be re-setup exactly as it was after new setup
    return gameSession.gameSetupData = GameSetup.createGameSetupData(gameSession, player1Data, player2Data);
  }
};

GameSetup.setupPlayerBasics = function (gameSession, player, playerData) {
  // store player properties
  player.setPlayerId(playerData.userId);
  player.setUsername(playerData.name);
  player.setIsRanked(playerData.gameType === GameType.Ranked);
  if (player.getIsRanked()) {
    player.setRank(playerData.rank);
  }
  if (playerData.startingMana != null) { return player.setStartingMana(playerData.startingMana); }
};

GameSetup.createGeneral = function (gameSession, player, generalCardData) {
  // create general
  const general = gameSession.getExistingCardFromIndexOrCreateCardFromData(generalCardData);
  general.setOwner(player);
  return general;
};

GameSetup.addGeneral = function (gameSession, player, general, generalX, generalY) {
  // apply general
  gameSession.applyCardToBoard(general, generalX, generalY);
  general.refreshExhaustion();

  // add signature card
  const signatureCardData = player.getSignatureCardData();
  if (signatureCardData != null) {
    const signatureCard = gameSession.getExistingCardFromIndexOrCreateCardFromData(signatureCardData);
    if (signatureCard != null) {
      signatureCard.setOwner(player);
      gameSession.applyCardToSignatureCards(signatureCard, signatureCardData);
    }
  }

  // set signature card as inactive
  return player.setIsSignatureCardActive(false);
};

GameSetup.setupDeck = function (gameSession, player) {
  const playerDeck = player.getDeck();

  // store deck properties
  return playerDeck.setOwnerId(player.getPlayerId());
};

GameSetup.addCardsToDeck = function (gameSession, player, playerData, playerCardsData) {
  if (playerCardsData != null) {
    let card; let cardData; let index; let
      playerStartingHandSize;
    const playerDeck = player.getDeck();

    // copy cards data
    playerCardsData = UtilsJavascript.deepCopy(playerCardsData);

    // remove first as it should always be general
    playerCardsData.shift();

    // change starting hand size as needed
    if (playerData.startingHandSize != null) {
      playerStartingHandSize = Math.max(0, playerData.startingHandSize);
    } else {
      playerStartingHandSize = CONFIG.STARTING_HAND_SIZE;
    }

    // now check for a Starts In Player Hand card, and if found, insert it at end of starting end
    for (index = 0; index < playerCardsData.length; index++) {
      cardData = playerCardsData[index];
      card = gameSession.getExistingCardFromIndexOrCreateCardFromData(cardData);
      if ((card != null) && card.hasModifierClass(ModifierStartsInHand)) {
        playerCardsData.splice(index, 1);
        card.setOwner(player);
        gameSession.applyCardToHand(playerDeck, cardData, card, playerStartingHandSize);
        break;
      }
    }

    // add cards to hand
    for (let i = 0, end = playerStartingHandSize, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
      if (!gameSession.getAreDecksRandomized()) {
        index = playerCardsData.length - 1;
      } else {
        index = Math.floor(Math.random() * playerCardsData.length);
      }
      cardData = playerCardsData.splice(index, 1)[0];
      card = gameSession.getExistingCardFromIndexOrCreateCardFromData(cardData);
      if (card != null) {
        card.setOwner(player);
        gameSession.applyCardToHand(playerDeck, cardData, card);
      }
    }

    // add cards to decks
    return (() => {
      const result = [];
      for (cardData of Array.from(playerCardsData)) {
        card = gameSession.getExistingCardFromIndexOrCreateCardFromData(cardData);
        if (card != null) {
          card.setOwner(player);
          result.push(gameSession.applyCardToDeck(playerDeck, cardData, card));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
};

GameSetup.addCardsToBoard = function (gameSession, boardCardsData, owner) {
  if (boardCardsData != null) {
    // copy cards data so we don't modify anything unintentionally
    boardCardsData = UtilsJavascript.deepCopy(boardCardsData);

    // add all cards to board
    return (() => {
      const result = [];
      for (const cardData of Array.from(boardCardsData)) {
        const card = gameSession.getExistingCardFromIndexOrCreateCardFromData(cardData);
        if (card != null) {
          // extract card data that should not be copied into card
          const {
            position,
          } = cardData;
          delete cardData.position;

          // set owner as needed
          // otherwise defaults to ownerId on card data or game session
          if (owner != null) {
            delete cardData.ownerId;
            card.setOwner(owner);
          }

          // apply to board
          gameSession.applyCardToBoard(card, position.x, position.y, cardData);

          if (card instanceof Entity) {
            result.push(card.refreshExhaustion());
          } else {
            result.push(undefined);
          }
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
};

// endregion SETUP NEW

// region SETUP FROM DATA

GameSetup.setupNewSessionFromExistingSessionData = function (gameSession, existingGameSessionData) {
  // store game setup data
  const {
    gameSetupData,
  } = existingGameSessionData;
  gameSession.gameSetupData = gameSetupData;

  // apply battlemap data
  gameSession.getBattleMapTemplate().deserialize(existingGameSessionData.battleMapTemplate);

  // get players and setup data
  const player1 = gameSession.getPlayer1();
  const player1SetupData = gameSetupData.players[0];
  const player2 = gameSession.getPlayer2();
  const player2SetupData = gameSetupData.players[1];

  // setup players
  GameSetup.setupPlayerFromData(gameSession, player1, player1SetupData);
  GameSetup.setupPlayerFromData(gameSession, player2, player2SetupData);

  // setup players
  GameSetup.addCardsToDeckFromData(gameSession, player1, player1SetupData);
  GameSetup.addCardsToDeckFromData(gameSession, player2, player2SetupData);

  // add all cards to board
  return GameSetup.addCardsToBoard(gameSession, gameSetupData.boardCardsData);
};

GameSetup.setupPlayerFromData = function (gameSession, player, playerGameSetupData) {
  GameSetup.setupPlayerBasics(gameSession, player, playerGameSetupData);
  return GameSetup.setupDeck(gameSession, player);
};

GameSetup.addCardsToDeckFromData = function (gameSession, player, playerGameSetupData) {
  let cardData;
  const playerDeck = player.getDeck();

  // add cards to decks
  for (cardData of Array.from(playerGameSetupData.startingDrawPile)) {
    gameSession.applyCardToDeck(playerDeck, cardData, gameSession.getExistingCardFromIndexOrCreateCardFromData(cardData));
  }

  // add cards to hand
  return (() => {
    const result = [];
    for (cardData of Array.from(playerGameSetupData.startingHand)) {
      if (cardData != null) {
        result.push(gameSession.applyCardToHand(playerDeck, cardData, gameSession.getExistingCardFromIndexOrCreateCardFromData(cardData)));
      } else {
        result.push(undefined);
      }
    }
    return result;
  })();
};

// endregion SETUP FROM DATA

// region GAME SETUP DATA

GameSetup.createGameSetupData = function (gameSession, player1Data, player2Data) {
  let allowUntargetable;
  const gameSetupData = {};

  // snapshot all cards on board
  gameSetupData.boardCardsData = [];
  for (const card of Array.from(gameSession.getBoard().getCards(null, (allowUntargetable = true)))) {
    gameSetupData.boardCardsData.push(card.createGameSetupCardData());
  }

  // snapshot player data
  gameSetupData.players = [];
  const player1 = gameSession.getPlayer1();
  gameSetupData.players[0] = GameSetup.createGameSetupDataForPlayer(gameSession, player1, player1Data);
  const player2 = gameSession.getPlayer2();
  gameSetupData.players[1] = GameSetup.createGameSetupDataForPlayer(gameSession, player2, player2Data);

  return gameSetupData;
};

GameSetup.createGameSetupDataForPlayer = function (gameSession, player, playerData) {
  const playerDeck = player.getDeck();
  const playerGeneral = gameSession.getGeneralForPlayer(player);
  const playerGameSetupData = {};

  // player data
  playerGameSetupData.playerId = player.getPlayerId();
  playerGameSetupData.userId = playerGameSetupData.playerId;
  playerGameSetupData.cardBackId = playerData.cardBackId;
  playerGameSetupData.battleMapIndexes = playerData.battleMapIndexes;
  playerGameSetupData.name = player.getUsername();
  playerGameSetupData.isRanked = player.getIsRanked();
  playerGameSetupData.factionId = playerGeneral.getFactionId();
  playerGameSetupData.generalId = playerGeneral.getId();
  playerGameSetupData.startingMana = player.getStartingMana();
  if (playerData.ticketId) {
    playerGameSetupData.ticketId = playerData.ticketId;
  }
  if (playerData.riftRating != null) {
    playerGameSetupData.riftRating = playerData.riftRating;
  }

  // store copies of decks to preserve original data
  playerGameSetupData.deck = UtilsJavascript.deepCopy(playerData.deck);

  // store copies of starting cards in deck to preserve original data
  playerGameSetupData.startingDrawPile = _.map(playerDeck.getCardsInDrawPile(), (card) => card.createGameSetupCardData());

  // store copies of starting cards in hand to preserve original data
  playerGameSetupData.startingHand = _.map(playerDeck.getCardsInHand(), (card) => {
    if (card != null) {
      return card.createGameSetupCardData();
    }
    return null;
  });

  return playerGameSetupData;
};

// endregion GAME SETUP DATA

module.exports = GameSetup;
