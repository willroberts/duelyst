/* eslint-disable
    no-console,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Promise = require('bluebird');
const PrettyError = require('pretty-error');
const knex = require('../../server/lib/data_access/knex');
const generatePushId = require('../../app/common/generate_push_id');
const NewPlayerProgressionStageEnum = require('../../app/sdk/progression/newPlayerProgressionStageEnum');
const NewPlayerProgressionHelper = require('../../app/sdk/progression/newPlayerProgressionHelper');

// configure pretty error
const prettyError = new PrettyError();
prettyError.skipNodeFiles();
prettyError.skipPackage('bluebird');

knex.transaction((tx) => Promise.all([
  tx.raw('DELETE FROM user_quests WHERE user_id NOT IN (SELECT user_id FROM user_new_player_progression WHERE module_name=\'core\' AND stage=\'has_played_a_match\')'),
  tx.raw('DELETE FROM user_new_player_progression WHERE NOT module_name = \'core\''),
  tx.raw('INSERT INTO user_new_player_progression (user_id,module_name,stage) (SELECT user_id, \'quest\' as module_name, \'unread\' as stage FROM user_new_player_progression WHERE module_name=\'core\' AND stage=\'done_with_tutorials\')'),
  tx.raw('UPDATE users SET tx_count = 0 WHERE id NOT IN (SELECT user_id FROM user_new_player_progression WHERE module_name=\'core\' AND stage=\'has_played_a_match\')'),
]).then(() => Promise.all([
  tx('user_new_player_progression')
    .where('module_name', 'core')
    .andWhere('stage', 'done_with_tutorials')
    .update({ stage: NewPlayerProgressionStageEnum.TutorialDone.key }),
  tx('user_new_player_progression')
    .where('module_name', 'core')
    .andWhere('stage', 'has_played_a_match')
    .update({ stage: NewPlayerProgressionHelper.FinalStage.key }),
]))).then(() => {
  console.log('done');
  return process.exit(0);
}).catch((e) => {
  console.log(`ERROR! ${e.message}`);
  console.log(prettyError.render(e));
  return process.exit(1);
});
