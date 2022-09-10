/* eslint-disable
    consistent-return,
    implicit-arrow-linebreak,
    import/no-unresolved,
    import/order,
    max-len,
    no-cond-assign,
    no-console,
    no-continue,
    no-mixed-spaces-and-tabs,
    no-multiple-empty-lines,
    no-plusplus,
    no-restricted-syntax,
    no-return-assign,
    no-tabs,
    no-underscore-dangle,
    no-unreachable,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Logger = require('app/common/logger');

const FactionsLookup = require('app/sdk/cards/factionsLookup');
const FactionFactory = require('app/sdk/cards/factionFactory');
const GameSession = require('app/sdk/gameSession');
const CardFactory = require('app/sdk/cards/cardFactory');
const GameType = require('app/sdk/gameType');
const CardType = require('app/sdk/cards/cardType');
const Rarity = require('app/sdk/cards/rarityLookup');
const UtilsGameSession = require('app/common/utils/utils_game_session');
const _ = require('underscore');
const moment = require('moment');
const QuestType = require('./questTypeLookup');
const Quest = require('./quest');
const QuestWinWithFaction = require('./questWinWithFaction');
const QuestParticipationWithFaction = require('./questParticipationWithFaction');
const QuestAlternateDealDamage = require('./questAlternateDealDamage');
const QuestAlternateDestroyUnits = require('./questAlternateDestroyUnits');
const QuestGameGoal = require('./questGameGoal');

// beginner quests
const QuestBeginnerWinPracticeGames = require('./questBeginnerWinPracticeGames');
const QuestBeginnerPlayPracticeGames = require('./questBeginnerPlayPracticeGames');
const QuestBeginnerCompleteSoloChallenges = require('./questBeginnerCompleteSoloChallenges');
const QuestBeginnerFactionLevel = require('./questBeginnerFactionLevel');
const QuestBeginnerPlayOneQuickMatch = require('./questBeginnerPlayOneQuickMatch');
const QuestBeginnerWinFourPracticeGames = require('./questBeginnerWinFourPracticeGames');
const QuestBeginnerWinThreeQuickMatches = require('./questBeginnerWinThreeQuickMatches');
const QuestBeginnerWinThreeRankedMatches = require('./questBeginnerWinThreeRankedMatches');
const QuestBeginnerWinTwoPracticeGames = require('./questBeginnerWinTwoPracticeGames');
const QuestBeginnerWinOneSeasonGame = require('./questBeginnerWinOneSeasonGame');

// catch up quest
const QuestCatchUp = require('./questCatchUp.coffee');

// seasonal quests
const QuestFrostfire2016 = require('./questFrostfire2016.coffee');
const QuestSeasonal2017February = require('./questSeasonal2017February.coffee');
const QuestSeasonal2017March = require('./questSeasonal2017March.coffee');
const QuestSeasonal2017April = require('./questSeasonal2017April.coffee');
const QuestSeasonal2017May = require('./questSeasonal2017May.coffee');
const QuestSeasonal2017October = require('./questSeasonal2017October.coffee');
const QuestSeasonal2018February = require('./questSeasonal2018February.coffee');
const QuestFrostfire2017 = require('./questFrostfire2017.coffee');
const QuestLegacyLaunch = require('./questLegacyLaunch');

// Promo Quests
const QuestAnniversary2017 = require('./questAnniversary2017.coffee');



const i18next = require('i18next');

class QuestFactory {
  static initClass() {
    // global cache for quick access
    this._questCache = null;

    this.SHORT_QUEST_GOLD = 20;
    this.LONG_QUEST_GOLD = 50;

    // begin CONSTS DO NOT CHANGE # Iterate last by 100 for new quest base id
    this._FACTION_CHALLENGER_BASE_ID = 100;
    this._FACTION_DOMINANCE_BASE_ID = 200;
    this._KUMITE_INITIATE_ID = 300;
    this._ASSASIN_MASTER_ID = 400;
    this._ASSASIN_ID = 401;
    this._ULTIMATE_AGRESSOR_ID = 500;
    this._SMALL_WORLD_ID = 600;
    this._DOMINATOR_ID = 700;
    this._ARCANYST_BANE_ID = 800;
    this._CONSERVERS_CHALLENGE_ID = 900;
    this._PATRONS_DUTY_ID = 1000;
    this._MENTORS_TEACHING_ID = 1100;
    this._SHORT_GENERAL_PARTICIPATION_BASE_ID = 1200;
    this._SHORT_PARTICIPATION_ID = 1300;
    this._SHORT_GAUNTLET_PARTICIPATION_ID = 1400;
    this._LONG_PARTICIPATION_ID = 1500;
    this._LONG_GENERAL_DESTROYER_ID = 1600;
    this._LONG_MINION_SUMMON_ID = 1700;
    this._LONG_MINION_DESTROYER_ID = 1800;
  }

  // end CONSTS DO NOT CHANGE #

  // Building out quests from here: https://docs.google.com/spreadsheets/d/1-PBRo9BeaJF8DeZ3Qdin305g5KurNxe0qNnyP48UvDw/edit#gid=2126045548
  static _generateQuestCache() {
    let faction; let
      id;
    Logger.module('SDK').debug('QuestFactory::_generateQuestCache - starting');

    const allFactions = FactionFactory.getAllPlayableFactions();

    this._questCache = [];

    // region Participation Quests
    // create partipation quests for each faction
    for (faction of Array.from(allFactions)) {
      id = this._FACTION_CHALLENGER_BASE_ID + faction.id;
      this._questCache.push(new QuestParticipationWithFaction(id, [QuestType.ShortQuest], this.SHORT_QUEST_GOLD, faction.id));
    }
    // endregion Participation Quests

    // region Win Quests
    // create victory quests for each faction
    for (faction of Array.from(allFactions)) {
      id = this._FACTION_DOMINANCE_BASE_ID + faction.id;
      const shortenedFactionName = faction.name != null ? faction.name.split(' ')[0] : undefined; // Pulls "Lyonar" out of the factionName "Lyonar Kingdom"
      this._questCache.push(new QuestWinWithFaction(id, `${shortenedFactionName} Dominance`, [QuestType.ExcludeFromSystem], this.SHORT_QUEST_GOLD, faction.id, shortenedFactionName));
    }

    // Kumite Initiate Quest
    this._questCache.push(new QuestGameGoal(
      this._KUMITE_INITIATE_ID,
      'Kumite Initiate',
      [QuestType.ExcludeFromSystem],
      30,
      4,
      'Win 4 games with any Faction.',
      ((gameSessionData, playerId) => {
        const playerData = UtilsGameSession.getPlayerDataForId(gameSessionData, playerId);

        // Player has to win to make progress
        if (playerData.isWinner) {
          return 1;
        }
        return 0;
      }),
    ));
    // endregion Win Quests

    // region Challenge Quests
    // Assassin quest
    this._questCache.push(new QuestGameGoal(
      this._ASSASIN_MASTER_ID,
      'Assassin Master',
      [QuestType.ExcludeFromSystem],
      20,
      2,
      'Destroy at least 5 minions in one game. Twice.',
      ((gameSessionData, playerId) => {
        const playerData = UtilsGameSession.getPlayerDataForId(gameSessionData, playerId);

        if (playerData.totalMinionsKilled >= 5) {
          return 1;
        }
        return 0;
      }),
    ));

    this._questCache.push(new QuestGameGoal(
      this._ASSASIN_ID,
      'Assassin',
      [QuestType.ExcludeFromSystem],
      20,
      1,
      'Destroy at least 5 minions in one game.',
      ((gameSessionData, playerId) => {
        const playerData = UtilsGameSession.getPlayerDataForId(gameSessionData, playerId);

        if (playerData.totalMinionsKilled >= 5) {
          return 1;
        }
        return 0;
      }),
    ));

    // Ultimate Agressor quest
    this._questCache.push(new QuestGameGoal(
      this._ULTIMATE_AGRESSOR_ID,
      'Ultimate Aggressor',
      [QuestType.ExcludeFromSystem],
      30,
      1,
      'Deal 40 damage in a single game.',
      ((gameSessionData, playerId) => {
        const playerData = UtilsGameSession.getPlayerDataForId(gameSessionData, playerId);

        if (playerData.totalDamageDealt >= 40) {
          return 1;
        }
        return 0;
      }),
    ));

    // Small World quest
    this._questCache.push(new QuestGameGoal(
      this._SMALL_WORLD_ID,
      'Small World',
      [QuestType.ExcludeFromSystem],
      20,
      2,
      'Win two games using only cards costing 3 or less.',
      ((gameSessionData, playerId) => {
        const playerData = UtilsGameSession.getPlayerDataForId(gameSessionData, playerId);

        // Player has to win to make progress
        if (!playerData.isWinner) {
          return 0;
        }

        // Player can't use any cards with cost greater than 3 to make progress
        const playerGameSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameSessionData, playerId);
        for (const cardData of Array.from(playerGameSetupData.deck)) {
          const card = GameSession.getInstance().getOrCreateCardFromDataOrIndex(cardData);
          if ((card != null ? card.getBaseManaCost() : undefined) > 3) {
            return 0;
          }
        }

        // If above conditions are met, player makes 1 progress
        return 1;
      }),
    ));

    // Dominator quest
    const dominatorQuest = new QuestGameGoal(
      this._DOMINATOR_ID,
      'Dominator',
      [QuestType.ExcludeFromSystem],
      30,
      2,
      'Win 2 games of any type in a row.',
      ((gameSessionData, playerId) => {
        const playerData = UtilsGameSession.getPlayerDataForId(gameSessionData, playerId);

        // Player has to win to make progress
        if (playerData.isWinner) {
          return 1;
        }
        return 0;
      }),
    );
    dominatorQuest.setRequiresStreak();
    this._questCache.push(dominatorQuest);

    // Arcanyst Bane quest
    this._questCache.push(new QuestGameGoal(
      this._ARCANYST_BANE_ID,
      'Arcanyst Bane',
      [QuestType.ExcludeFromSystem],
      30,
      2,
      'Win 2 games with a deck containing less than 5 spells.',
      ((gameSessionData, playerId) => {
        let left;
        const playerData = UtilsGameSession.getPlayerDataForId(gameSessionData, playerId);

        // Player has to win to make progress
        if (!playerData.isWinner) {
          return 0;
        }

        // Player can't use 5 or more spells and make progress
        const playerGameSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameSessionData, playerId);
        let numSpells = 0;
        for (const cardData of Array.from(playerGameSetupData.deck)) {
          const card = GameSession.getInstance().getOrCreateCardFromDataOrIndex(cardData);
          if (CardType.getIsSpellCardType(card != null ? card.getType() : undefined)) {
            numSpells++;
          }
        }

        // If player used less than desired number of spells makes 1 progress
        return ((left = numSpells < 5)) != null ? left : { 1: 0 };
      }),
    ));

    // Conserver's Challenge quest
    this._questCache.push(new QuestGameGoal(this._CONSERVERS_CHALLENGE_ID, 'Conserver\'s Challenge', [QuestType.ExcludeFromSystem], 25, 1, 'Win a game with a deck containing only Basic cards.', ((gameSessionData, playerId) => {
      let playerGameSetupData;
      const playerData = UtilsGameSession.getPlayerDataForId(gameSessionData, playerId);

      // Player has to win to make progress
      if (!playerData.isWinner) {
        return 0;

        // Player can't use any cards with cost greater than 3 to make progress
			 playerGameSetupData = UtilsGameSession.getPlayerSetupDataForPlayerId(gameSessionData, playerId);
      }
      for (const cardData of Array.from(playerGameSetupData.deck)) {
        const cardId = cardData.id;
        const card = GameSession.getInstance().createCardForIdentifier(cardId);
        if (card.getRarityId() !== Rarity.Fixed) { // Fixed is basic rarity
          return 0;
        }
      }

      // If we reached here, no basic cards were found and game was won, 1 progress made
      return 1;
    })));
    // endregion Challenge Quests

    // # region Social Quests
    // Patron's Duty Quest
    const patronsQuest = new QuestGameGoal(
      this._PATRONS_DUTY_ID,
      'Patron\'s Duty',
      [QuestType.ExcludeFromSystem],
      30,
      4,
      'Play 4 games against a friend.',
      ((gameSessionData, playerId) => {
        // redundant check with friendly matches count, but will leave in for readability
        if (gameSessionData.gameType === GameType.Friendly) {
          return 1;
        }
        return 0;
      }),
    );
    patronsQuest.setFriendlyMatchesCount();
    this._questCache.push(patronsQuest);

    // Mentor's Teaching Quest
    const mentorsQuest = new QuestGameGoal(
      this._MENTORS_TEACHING_ID,
      'Mentor\'s Teaching',
      [QuestType.ExcludeFromSystem],
      20,
      2,
      'Win two games against a friend.',
      ((gameSessionData, playerId) => {
        const playerData = UtilsGameSession.getPlayerDataForId(gameSessionData, playerId);
        // redundant check for isfriendly but will leave in for readability
        if (playerData.isWinner && (gameSessionData.gameType === GameType.Friendly)) {
          return 1;
        }
        return 0;
      }),
    );
    mentorsQuest.setFriendlyMatchesCount();
    this._questCache.push(mentorsQuest);

    // endregion Social Quests

    // region Quests for Econ Update

    this._questCache.push(new QuestGameGoal(
      this._SHORT_PARTICIPATION_ID,
      'Conquerer',
      [QuestType.ExcludeFromSystem],
      this.SHORT_QUEST_GOLD,
      5,
      'Play 5 games.',
      (gameSessionData, playerId) => // Each game is always 1 progress
        1,
    ));

    // TODO: Before activating, requires adding check for whether player can play Gauntlet
    this._questCache.push(new QuestGameGoal(
      this._SHORT_GAUNTLET_PARTICIPATION_ID,
      'Gauntlet Initiate',
      [QuestType.ExcludeFromSystem],
      this.SHORT_QUEST_GOLD,
      3,
      'Play 3 Gauntlet games.',
      ((gameSessionData, playerId) => {
        // Each gauntlet game is 1 progress
        if (gameSessionData.gameType === GameType.Gauntlet) {
          return 1;
        }
        return 0;
      }),
    ));

    this._questCache.push(new QuestGameGoal(
      this._LONG_PARTICIPATION_ID,
      i18next.t('quests.quest_adventurer_title'),
      [QuestType.LongQuest],
      this.LONG_QUEST_GOLD,
      8,
      i18next.t('quests.quest_adventurer_desc', { count: 8 }),
      (gameSessionData, playerId) => // Each game is always 1 progress
        1,
    ));

    this._questCache.push(new QuestGameGoal(
      this._LONG_GENERAL_DESTROYER_ID,
      i18next.t('quests.quest_ultimate_aggressor_title'),
      [QuestType.LongQuest],
      this.LONG_QUEST_GOLD,
      150,
      i18next.t('quests.quest_ultimate_aggressor_desc', { count: 150 }),
      ((gameSessionData, playerId) => {
        const playerData = UtilsGameSession.getPlayerDataForId(gameSessionData, playerId);

        if (playerData.totalDamageDealtToGeneral > 0) {
          // If a player won, and they did less than 25 damage to enemy general, give them 25 credit
          if (playerData.isWinner && (playerData.totalDamageDealtToGeneral < 25)) {
            return 25;
          }
          return playerData.totalDamageDealtToGeneral;
        }
        return 0;
      }),
    ));

    this._questCache.push(new QuestGameGoal(
      this._LONG_MINION_SUMMON_ID,
      'Minion Master',
      [QuestType.ExcludeFromSystem],
      this.LONG_QUEST_GOLD,
      50,
      'Play 50 Minion cards.',
      ((gameSessionData, playerId) => {
        const playerData = UtilsGameSession.getPlayerDataForId(gameSessionData, playerId);

        if (playerData.totalMinionsPlayedFromHand > 0) {
          return playerData.totalMinionsPlayedFromHand;
        }
        return 0;
      }),
    ));

    this._questCache.push(new QuestGameGoal(
      this._LONG_MINION_DESTROYER_ID,
      i18next.t('quests.quest_assassin_title'),
      [QuestType.LongQuest],
      this.LONG_QUEST_GOLD,
      50,
      i18next.t('quests.quest_assassin_desc', { count: 50 }),
      ((gameSessionData, playerId) => {
        const playerData = UtilsGameSession.getPlayerDataForId(gameSessionData, playerId);

        if (playerData.totalMinionsKilled > 0) {
          return playerData.totalMinionsKilled;
        }
        return 0;
      }),
    ));

    // beginner Quests
    this._questCache.push(new QuestBeginnerWinPracticeGames());
    this._questCache.push(new QuestBeginnerPlayPracticeGames());
    this._questCache.push(new QuestBeginnerCompleteSoloChallenges());
    this._questCache.push(new QuestBeginnerWinOneSeasonGame());

    this._questCache.push(new QuestBeginnerFactionLevel());
    this._questCache.push(new QuestBeginnerPlayOneQuickMatch());
    this._questCache.push(new QuestBeginnerWinFourPracticeGames());
    this._questCache.push(new QuestBeginnerWinTwoPracticeGames());
    this._questCache.push(new QuestBeginnerWinThreeQuickMatches());
    this._questCache.push(new QuestBeginnerWinThreeRankedMatches());

    // Catch up quest
    this._questCache.push(new QuestCatchUp());

    // Seasonal Quests
    this._questCache.push(new QuestFrostfire2016());
    this._questCache.push(new QuestSeasonal2017February());
    this._questCache.push(new QuestSeasonal2017March());
    this._questCache.push(new QuestSeasonal2017April());
    this._questCache.push(new QuestSeasonal2017May());
    this._questCache.push(new QuestSeasonal2017October());
    this._questCache.push(new QuestFrostfire2017());
    this._questCache.push(new QuestSeasonal2018February());
    this._questCache.push(new QuestLegacyLaunch());

    // Promo Quests
    return this._questCache.push(new QuestAnniversary2017());
  }

  static questForIdentifier(identifier) {
    if (!this._questCache) {
      this._generateQuestCache();
    }

    for (const quest of Array.from(this._questCache)) {
      if (quest.id === identifier) {
        return quest;
      }
    }

    return undefined;
  }

  // Based on quest slot type chances create a quest that isn't one of the excludedQuests
  static randomQuestForSlotExcludingIds(slotIndex, excludedQuestIds) {
    if (!this._questCache) {
      this._generateQuestCache();
    }

    // Get the type chances for this slot
    const questChancesForSlot = this._questChancesForSlot(slotIndex);

    const validQuestChanceTuples = [];

    // Add any quests that fit parameters
    for (const questChanceTuple of Array.from(questChancesForSlot)) {
      const sdkQuest = questChanceTuple[0];

      if (_.contains(excludedQuestIds, sdkQuest.getId())) {
        continue;
      }

      if (_.contains(sdkQuest.getTypes(), QuestType.ExcludeFromSystem)) {
        // Quests should primarily be blocked by generation by their existence in _questChancesForSlot
        console.warn(`QuestFactory.randomQuestForSlotExcludingIds - quest with id ${sdkQuest.getId()} blocked from generation by type`);
        continue;
      }

      validQuestChanceTuples.push(questChanceTuple);
    }

    // This should never happen
    if (validQuestChanceTuples.length === 0) {
      console.warn('QuestFactory.randomQuestForSlotExcludingIds - Zero valid quests');
      return this.questForIdentifier(this._SHORT_PARTICIPATION_ID);
    }

    const chanceSum = _.reduce(
      validQuestChanceTuples,
      (memo, tuple) => memo + tuple[1],
      0,
    );
    const inverseChanceSum = 1.0 / chanceSum;

    const normalizedQuestChanceTuples = _.map(validQuestChanceTuples, (tuple) => [tuple[0], tuple[1] * inverseChanceSum]);

    const questSeed = Math.random();
    let currentPercentage = 0;
    for (const questTuple of Array.from(normalizedQuestChanceTuples)) {
      currentPercentage += questTuple[1];
      if (currentPercentage >= questSeed) {
        return questTuple[0];
      }
    }

    // Should never reach here
    // TODO: error logging
    return this.questForIdentifier(this._SHORT_PARTICIPATION_ID);
  }

  // Given a slot index, returns an array of tuples
  // Each tuple contains [Quest,percentage chance for Quest]
  static _questChancesForSlot(slotIndex) {
    if (slotIndex === 0) {
      return 	[
        [this.questForIdentifier(this._FACTION_CHALLENGER_BASE_ID + FactionsLookup.Faction1), 0.13],
        [this.questForIdentifier(this._FACTION_CHALLENGER_BASE_ID + FactionsLookup.Faction2), 0.13],
        [this.questForIdentifier(this._FACTION_CHALLENGER_BASE_ID + FactionsLookup.Faction3), 0.13],
        [this.questForIdentifier(this._FACTION_CHALLENGER_BASE_ID + FactionsLookup.Faction4), 0.13],
        [this.questForIdentifier(this._FACTION_CHALLENGER_BASE_ID + FactionsLookup.Faction5), 0.13],
        [this.questForIdentifier(this._FACTION_CHALLENGER_BASE_ID + FactionsLookup.Faction6), 0.13],
      ];
    } if (slotIndex === 1) {
      return 	[
        [this.questForIdentifier(this._LONG_PARTICIPATION_ID), 0.33],
        [this.questForIdentifier(this._LONG_GENERAL_DESTROYER_ID), 0.33],
        [this.questForIdentifier(this._LONG_MINION_DESTROYER_ID), 0.33],
      ];
    }
    console.warn('QuestFactory._questChancesForSlot - Should not reach here');
    return [[this.questForIdentifier(this._SHORT_PARTICIPATION_ID), 1.0]];
  }

  /**
	 * Returns the available seasonal quest for the UTC time provided.
	 * @public
	 * @param	{Moment}	momentUtc	Pass in the current system time.
	 * @return	{Quest}					Quest object or NULL if no seasonal quest available.
	 */
  static seasonalQuestForMoment(momentUtc) {
    if (!this._questCache) {
      this._generateQuestCache();
    }
    const seasonalQuests = _.filter(this._questCache, (q) => _.contains(q.types, QuestType.Seasonal));
    for (const q of Array.from(seasonalQuests)) {
      if (q.isAvailableOn && q.isAvailableOn(momentUtc)) {
        return q;
      }
    }
  }

  /**
	 * Returns the available promotional quest for the UTC time provided.
	 * @public
	 * @param	{Moment}	momentUtc	Pass in the current system time.
	 * @return	{Quest}					Quest object or NULL if no seasonal quest available.
	 */
  static promotionalQuestForMoment(momentUtc) {
    if (!this._questCache) {
      this._generateQuestCache();
    }
    const promoQuests = _.filter(this._questCache, (q) => _.contains(q.types, QuestType.Promotional));
    for (const q of Array.from(promoQuests)) {
      if (q.isAvailableOn && q.isAvailableOn(momentUtc)) {
        return q;
      }
    }
  }
}
QuestFactory.initClass();

module.exports = QuestFactory;
