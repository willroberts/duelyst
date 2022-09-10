/* eslint-disable
    func-names,
    global-require,
    import/no-extraneous-dependencies,
    max-len,
    no-console,
    no-param-reassign,
    no-restricted-syntax,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
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

const ec2 = new AWS.EC2({ region: 'us-west-2' });
Promise.promisifyAll(ec2);

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

Promise.all([
  ec2.describeInstancesAsync(),
  ec2.describeReservedInstancesAsync(),
]).spread((instances, reservedInstances) => {
  reservedInstances = _.filter(reservedInstances.ReservedInstances, (o) => o.State !== 'retired');
  reservedInstances = _.map(reservedInstances, (o) => _.pick(o, 'InstanceType', 'AvailabilityZone', 'InstanceCount', 'State'));
  const reservedInstancesReduced = _.reduce(
    reservedInstances,
    (memo, o) => {
      let r = _.find(memo, (i) => (o.InstanceType === i.InstanceType) && (o.AvailabilityZone === i.AvailabilityZone));
      if ((r == null)) {
        r = _.clone(o);
        memo.push(r);
      } else {
        r.InstanceCount += o.InstanceCount;
      }
      return memo;
    },
    [],
  );

  for (const reservedInstance of Array.from(reservedInstancesReduced)) {
    for (const reservation of Array.from(instances.Reservations)) {
      for (const instance of Array.from(reservation.Instances)) {
        console.log(instance);
        if ((instance.State.Name === 'running') && (instance.InstanceType === reservedInstance.InstanceType) && (instance.Placement.AvailabilityZone === reservedInstance.AvailabilityZone)) {
          console.log('found running instance...');
          if (reservedInstance.runningCount == null) { reservedInstance.runningCount = 0; }
          reservedInstance.runningCount += 1;
        }
      }
    }
  }

  // console.log prettyjson.render(instances)
  // console.log prettyjson.render(instances)
  return logAsTable(reservedInstancesReduced);
});
