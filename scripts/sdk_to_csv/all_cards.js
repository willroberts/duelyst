/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */


const SDK = require("../../app/sdk");

console.log("running");

let str = "id,factionid,factionname,rarity,name\n";
for (let card of Array.from(SDK.CardFactory.getAllCards(SDK.GameSession.current()))) {
	str += `${card.id},${card.factionId},${SDK.FactionFactory.factionForIdentifier(card.factionId).name},\"${SDK.RarityFactory.rarityForIdentifier(card.rarityId).name}\",\"${card.name}\" \n`;
}

console.log(str);
process.exit(1);
