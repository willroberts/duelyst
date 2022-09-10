/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Achievement = require('app/sdk/achievements/achievement');
const QuestFactory = require('app/sdk/quests/questFactory');
const i18next = require('i18next');

class JourneymanQuestorAchievement extends Achievement {
	static initClass() {
		this.id = "journeymanQuestor";
		this.title = i18next.t("achievements.journeyman_questor_title");
		this.description = i18next.t("achievements.journeyman_questor_desc");
		this.progressRequired = 1;
		this.rewards =
			{neutralEpicCard: 1};
	}

	static progressForCompletingQuestId(questId) {
		const sdkQuest = QuestFactory.questForIdentifier(questId);
		if ((sdkQuest != null) && !sdkQuest.isBeginner) {
			return 1;
		} else {
			return 0;
		}
	}
}
JourneymanQuestorAchievement.initClass();

module.exports = JourneymanQuestorAchievement;
