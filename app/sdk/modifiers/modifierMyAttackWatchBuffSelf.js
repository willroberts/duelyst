/* eslint-disable
    import/no-unresolved,
    max-len,
    no-param-reassign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Logger = require('app/common/logger');
const AttackAction = require('app/sdk/actions/attackAction');
const CardType = require('app/sdk/cards/cardType');
const Stringifiers = require('app/sdk/helpers/stringifiers');

const i18next = require('i18next');
const ModifierMyAttackWatch = require('./modifierMyAttackWatch');
const Modifier = require('./modifier');

class ModifierMyAttackWatchBuffSelf extends ModifierMyAttackWatch {
  static initClass() {
    this.prototype.type = 'ModifierMyAttackWatchBuffSelf';
    this.type = 'ModifierMyAttackWatchBuffSelf';
  }

  static createContextObject(attackBuff, maxHPBuff, options) {
    if (attackBuff == null) { attackBuff = 0; }
    if (maxHPBuff == null) { maxHPBuff = 0; }
    if (options == null) { options = undefined; }
    const contextObject = super.createContextObject(options);
    const statContextObject = Modifier.createContextObjectWithAttributeBuffs(attackBuff, maxHPBuff);
    statContextObject.appliedName = i18next.t('modifiers.faction_2_gorehorn_buff_name');
    contextObject.modifiersContextObjects = [statContextObject];
    return contextObject;
  }

  onMyAttackWatch(action) {
    // override me in sub classes to implement special behavior
    return this.applyManagedModifiersFromModifiersContextObjects(this.modifiersContextObjects, this.getCard());
  }
}
ModifierMyAttackWatchBuffSelf.initClass();

module.exports = ModifierMyAttackWatchBuffSelf;
