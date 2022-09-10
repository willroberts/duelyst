/* eslint-disable
    consistent-return,
    func-names,
    global-require,
    implicit-arrow-linebreak,
    import/no-extraneous-dependencies,
    import/no-unresolved,
    max-len,
    no-console,
    no-param-reassign,
    no-restricted-syntax,
    no-tabs,
    no-this-before-super,
    no-useless-escape,
    radix,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const prettyjson = require('prettyjson');
const _ = require('underscore');
const moment = require('moment');
const ProgressBar = require('progress');
const moniker = require('moniker');
const inquirer = require('inquirer');
const request = require('request');

const requestAsync = Promise.promisify(request);

const ec2 = new AWS.EC2({ region: 'us-west-2' });
const opsworks = new AWS.OpsWorks({ region: 'us-east-1' });
const cloudwatch = new AWS.CloudWatch({ region: 'us-east-1' });
Promise.promisifyAll(ec2);
Promise.promisifyAll(opsworks);
Promise.promisifyAll(cloudwatch);

let environment = 'staging';
let STACK_ID = '25f5d045-5e8f-4fb4-a7b4-4bdbd90935c1';
let GAME_LAYER_ID = 'e67f9dfa-b0f5-44f7-ab82-900ab0f1734f';
let AI_LAYER_ID = '678a9191-d9e0-4ba3-b2f2-ac788e38abfa';

if (process.env.NODE_ENV === 'production') {
  console.log('PRODUCTION MODE');
  environment = 'production';
  STACK_ID = '67804928-7fd2-449f-aec7-15acfba70874';
  GAME_LAYER_ID = '5de77de8-f748-4df4-a85a-e40dccc1a05f';
  AI_LAYER_ID = 'cece3db3-e013-4acc-9ca8-ef59113f41e3';
}

/**
 * console.log data as a table
 * @public
 * @param	{String}	data			data to print out.
 */
const logAsTable = function (dataRows) {
  const keys = _.keys(dataRows[0]);
  const Table = require('cli-table');
  const t = new Table({
    head: keys,
  });
  _.each(dataRows, (r) => {
    let values = _.values(r);
    values = _.map(values, (v) => {
      if (v instanceof Date) {
        v = moment(v).format('YYYY-MM-DD');
      }
      return v || '';
    });
    return t.push(values);
  });

  const strTable = t.toString();
  console.log(strTable);
  return strTable;
};

/**
 * Custom error used by the confirmation prompt promise
 * @class
 */
class DidNotConfirmError extends Error {
  constructor(message) {
    if (message == null) { message = 'You did not confirm.'; }
    this.message = message;
    this.name = 'DidNotConfirmError';
    this.status = 404;
    this.description = 'You did not confirm.';
    Error.captureStackTrace(this, DidNotConfirmError);
    super(this.message);
  }
}

/**
 * Show a general purpose confirmation prompt
 * @public
 * @param	{String}	msg			Custom confirmation message.
 * @return	{Promise}				Promise that will resolve if the user confirms with a 'Y' or reject with DidNotConfirmError otherwise.
 */
const confirmAsync = function (msg) {
  if (msg == null) { msg = '...'; }
  return new Promise((resolve, reject) => inquirer.prompt([{
    name: 'confirm',
    message: `<${environment}> ${msg} continue? Y/N?`,
  }], (answers) => {
    if (answers.confirm.toLowerCase() === 'y') {
      return resolve();
    }
    return reject(new DidNotConfirmError());
  }));
};

console.log('grabbing instance data for opsworks...');
console.time('done loading instance data');

Promise.all([
  opsworks.describeInstancesAsync({
    LayerId: AI_LAYER_ID,
  }),
  opsworks.describeInstancesAsync({
    LayerId: GAME_LAYER_ID,
  }),
])

  .bind({})

  .spread(function (aiInstances, gameInstances) { // after getting instances, load metric data from CloudWatch for CPU STEAL TIME
    console.timeEnd('done loading instance data');

    // console.log gameInstances

    aiInstances = _.map(aiInstances.Instances, (instance) => _.pick(instance, [
      'InstanceId',
      'Hostname',
      'PrivateIp',
      'PublicIp',
      'Status',
    ]));

    gameInstances = _.map(gameInstances.Instances, (instance) => _.pick(instance, [
      'InstanceId',
      'Hostname',
      'PrivateIp',
      'PublicIp',
      'Status',
    ]));

    this.aiInstances = _.filter(aiInstances, (i) => i.Status === 'online');
    this.gameInstances = _.filter(gameInstances, (i) => i.Status === 'online');

    const bar = new ProgressBar('getting metric data [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: parseInt(this.gameInstances.length),
    });

    return Promise.map(
      this.gameInstances,
      (instance, index) => cloudwatch.getMetricStatisticsAsync({
        Namespace: 'AWS/OpsWorks',
        MetricName: 'cpu_steal',
        Period: 60 * 60, // 1 hour
        Statistics: ['Maximum'],
        StartTime: moment().utc().subtract(1, 'hour').toDate(),
        EndTime: moment().utc().toDate(),
        Dimensions: [
          {
            Name: 'InstanceId',
            Value: instance.InstanceId,
          },
        ],
      }).then((result) => {
        instance.MaxStealTime = result.Datapoints[0].Maximum;
        return bar.tick();
      }),
      { concurrency: 25 },
    );
  }).then(function () { // get HEALTH (player count) data for each server
    // @.gameInstances = _.filter(@.gameInstances, (instance)-> return instance["MaxStealTime"] > 1.0 )

    const bar = new ProgressBar('getting health data [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: parseInt(this.gameInstances.length),
    });

    return Promise.map(
      this.gameInstances,
      (instance, index) => requestAsync({ url: `http://${instance.PublicIp}/health` })
        .spread((res, body) => JSON.parse(body))
        .then((response) => {
          instance.Players = response.players;
          instance.Games = response.games;
          return bar.tick();
        }),
      { concurrency: 25 },
    );
  })
  .then(function () { // load CONSUL maintenance info data for each instance
    const bar = new ProgressBar('getting consul data [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: parseInt(this.gameInstances.length),
    });

    return Promise.map(
      this.gameInstances,
      (instance, index) => {
        const url = `https://consul.duelyst.com/v1/health/node/${environment}-${instance.Hostname}`;
        return requestAsync({ url })
          .spread((res, body) => JSON.parse(body)).then((response) => {
            const maintenance = _.find(response, (item) => item.CheckID === '_node_maintenance');
            if (maintenance) {
              instance.MaintMode = true;
            } else {
              instance.MaintMode = false;
            }
            return bar.tick();
          });
      },
      { concurrency: 25 },
    );
  })
  .then(function (results) { // when all data is loaded, retire any instances that have HIGH steal time
    let instances = this.gameInstances;
    // instances = _.filter(instances, (instance)-> return instance["MaxStealTime"] > 1.0 )
    instances = _.sortBy(instances, 'MaxStealTime');

    logAsTable(instances);

    this.retiredInstances = instances;
    // @.retiredInstances = _.filter @.retiredInstances, (i)-> i.Hostname == "api-game1s-wakeful-substance"
    this.retiredInstances = _.filter(this.retiredInstances, (instance) => (instance.MaxStealTime > 5.0) && (instance.MaintMode !== true));
    const retiredInstanceIds = _.map(this.retiredInstances, (i) => i.InstanceId);

    if (this.retiredInstances.length > 0) {
      console.log('retiring instances: ', _.map(this.retiredInstances, (i) => i.Hostname));
      return confirmAsync('Retiring instances.');
    }
  })
  .then(function () { // ... after confirmation retire
    if (this.retiredInstances.length > 0) {
      const retiredInstanceIds = _.map(this.retiredInstances, (i) => i.InstanceId);
      const params = {
        Command: {
          Name: 'execute_recipes',
          Args: {
            recipes: ['sarlac::consul_maint_on'],
          },
        },
        StackId: STACK_ID,
        InstanceIds: retiredInstanceIds,
        Comment: 'Batch retiring instances',
      };
      console.log(params);
      return opsworks.createDeploymentAsync(params);
    }
  })
  .then(function () { // for each retired instance, create a substitute
    const allPromises = [];

    for (const instance of Array.from(this.retiredInstances)) {
      const match = instance.Hostname.match(/^(([a-z]+\-)+)+([a-z]+[0-9]+[a-z]*)(\-[a-z]+)*$/);
      const instanceName = match[1];
      const instanceNumber = match[3];

      const newName = `${instanceName}${instanceNumber}-${moniker.choose()}`;

      console.log(`creating new instance ${newName}`);

      const instanceParams = {
        Hostname: newName,
        LayerIds: [GAME_LAYER_ID],
        StackId: STACK_ID,
        SshKeyName: 'counterplay',
        Os: 'Custom',
        AmiId: 'ami-93e0faf2',
        InstallUpdatesOnBoot: false,
        InstanceType: 'm4.large',
      };

      // console.log instanceParams
      allPromises.push(opsworks.createInstanceAsync(instanceParams));
    }

    return Promise.all(allPromises);
  })
  .then((results) => { // start each new substitute instance
    if ((results != null ? results.length : undefined) > 0) {
      const bar = new ProgressBar('starting instances [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: parseInt(results.length),
      });

      return Promise.map(results, (instance) => opsworks.startInstanceAsync({
        InstanceId: instance.InstanceId,
      }).then(() => bar.tick()));
    }
  })
  .then(() => // done...

    console.log('ALL DONE'))
  .catch(DidNotConfirmError, (e) => console.log('ABORTED'));
