/* eslint-disable
    import/no-unresolved,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Deck = require('app/sdk/cards/deck');
const Sandbox = require('./sandbox');

class SandboxDeveloper extends Sandbox {
  static initClass() {
    this.type = 'SandboxDeveloper';
    this.prototype.type = 'SandboxDeveloper';

    this.prototype.skipMulligan = true;
  }

  setupSessionModes(gameSession) {
    super.setupSessionModes(gameSession);
    return gameSession.setIsDeveloperMode(true);
  }
}
SandboxDeveloper.initClass();

module.exports = SandboxDeveloper;
