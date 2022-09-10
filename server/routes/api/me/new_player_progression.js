/* eslint-disable
    camelcase,
    func-names,
    import/no-unresolved,
    max-len,
    no-param-reassign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const express = require('express');
const t = require('tcomb-validation');
const UsersModule = require('../../../lib/data_access/users');
const QuestsModule = require('../../../lib/data_access/quests');
const knex = require('../../../lib/data_access/knex');
const DataAccessHelpers = require('../../../lib/data_access/helpers');
const Logger = require('../../../../app/common/logger.coffee');

// sdk
const NewPlayerProgressionHelper = require('../../../../app/sdk/progression/newPlayerProgressionHelper');
const NewPlayerProgressionModuleLookup = require('../../../../app/sdk/progression/newPlayerProgressionModuleLookup');
const NewPlayerProgressionStageEnum = require('../../../../app/sdk/progression/newPlayerProgressionStageEnum');

const router = express.Router();

router.get('/', (req, res, next) => {
  const user_id = req.user.d.id;

  return knex('user_new_player_progression').where('user_id', user_id).select()
    .then((challengeRows) => {
      challengeRows = DataAccessHelpers.restifyData(challengeRows);
      return res.status(200).json(challengeRows);
    })
    .catch((error) => next(error));
});

router.post('/core', (req, res, next) => {
  const user_id = req.user.d.id;

  return UsersModule.iterateNewPlayerCoreProgression(user_id)
    .then((data) => {
      if (data) {
        return res.status(200).json(DataAccessHelpers.restifyData(data));
      }
      return res.status(304).json({});
    }).catch((error) => next(error));
});

router.post('/:module_name/stage', (req, res, next) => {
  let module_name = t.validate(req.params.module_name, t.Str);
  if (!module_name.isValid()) {
    return next();
  }
  let stage = t.validate(req.body.stage, t.Str);
  if (!stage.isValid()) {
    return res.status(400).json(stage.errors);
  }

  const user_id = req.user.d.id;
  module_name = module_name.value;
  stage = stage.value;

  return UsersModule.setNewPlayerFeatureProgression(user_id, module_name, stage)
    .bind({})
    .then(function (progressionData) {
      this.progressionData = progressionData;
      if ((module_name === NewPlayerProgressionModuleLookup.Core) && NewPlayerProgressionHelper.questsForStage(stage)) {
        return QuestsModule.generateBeginnerQuests(user_id);
      }
      return Promise.resolve();
    }).then(function (questData) {
      if (questData) {
        this.questData = questData;
      }
      return res.status(200).json(DataAccessHelpers.restifyData(this));
    })
    .catch((error) => next(error));
});

module.exports = router;
