/* eslint-disable
    consistent-return,
    import/no-unresolved,
    no-plusplus,
    no-this-before-super,
    no-underscore-dangle,
    prefer-rest-params,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CardType = require('app/sdk/cards/cardType');
const Action = require('./action');

class RemoveArtifactsAction extends Action {
  static initClass() {
    this.type = 'RemoveArtifactsAction';
  }

  constructor() {
    if (this.type == null) { this.type = RemoveArtifactsAction.type; }
    super(...arguments);
  }

  _execute() {
    super._execute();
    const target = this.getTarget();
    if (target != null) {
      if (!target.getIsGeneral()) { // artifacts are only on the general
        return;
      }

      // iterate over all modifiers with durabilty and remove them
      // (only artifacts have durability, regular modifiers do not)
      return (() => {
        const result = [];
        const iterable = target.getArtifactModifiers();
        for (let i = iterable.length - 1; i >= 0; i--) {
          const modifier = iterable[i];
          result.push(target.getGameSession().removeModifier(modifier));
        }
        return result;
      })();
    }
  }
}
RemoveArtifactsAction.initClass();

module.exports = RemoveArtifactsAction;
