// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const ModifierOnDyingResummonAnywhere = require('./modifierOnDyingResummonAnywhere');

class ModifierQuestBuffAbyssian extends ModifierOnDyingResummonAnywhere {
  static initClass() {
    this.prototype.type = 'ModifierQuestBuffAbyssian';
    this.type = 'ModifierQuestBuffAbyssian';

    this.prototype.maxStacks = 1;
  }
}
ModifierQuestBuffAbyssian.initClass();

module.exports = ModifierQuestBuffAbyssian;
