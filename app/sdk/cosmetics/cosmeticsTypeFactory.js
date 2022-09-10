/* eslint-disable
    guard-for-in,
    no-console,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

const i18next = require('i18next');
const CosmeticsTypeLookup = require('./cosmeticsTypeLookup');

class CosmeticsTypeFactory {
  static cosmeticsTypeForIdentifier(identifier) {
    let typeData = null;

    if (identifier === CosmeticsTypeLookup.Emote) {
      typeData = {
        id: CosmeticsTypeLookup.Emote,
        name: i18next.t('cosmetics.cosmetic_type_emote'),
      };
    }

    if (identifier === CosmeticsTypeLookup.CardBack) {
      typeData = {
        id: CosmeticsTypeLookup.CardBack,
        name: i18next.t('cosmetics.cosmetic_type_card_back'),
      };
    }

    if (identifier === CosmeticsTypeLookup.ProfileIcon) {
      typeData = {
        id: CosmeticsTypeLookup.ProfileIcon,
        name: i18next.t('cosmetics.cosmetic_type_profile_icon'),
      };
    }

    if (identifier === CosmeticsTypeLookup.Scene) {
      typeData = {
        id: CosmeticsTypeLookup.Scene,
        name: i18next.t('cosmetics.cosmetic_type_scene'),
      };
    }

    if (identifier === CosmeticsTypeLookup.BattleMap) {
      typeData = {
        id: CosmeticsTypeLookup.BattleMap,
        name: i18next.t('cosmetics.cosmetic_type_battle_map'),
      };
    }

    if (identifier === CosmeticsTypeLookup.CardSkin) {
      typeData = {
        id: CosmeticsTypeLookup.CardSkin,
        name: i18next.t('cosmetics.cosmetic_type_card_skin'),
      };
    }

    if (typeData) {
      return typeData;
    }
    return console.error(`CosmeticsTypeFactory.cosmeticsTypeForIdentifier - Unknown cosmestics type identifier: ${identifier}`.red);
  }

  static getAllCosmeticsTypes() {
    const types = [];
    for (const typeKey in CosmeticsTypeLookup) {
      const identifier = CosmeticsTypeLookup[typeKey];
      const typeData = this.cosmeticsTypeForIdentifier(identifier);
      if (typeData != null) {
        types.push(typeData);
      }
    }

    return types;
  }
}

module.exports = CosmeticsTypeFactory;
