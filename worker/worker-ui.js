/* eslint-disable
    import/extensions,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const colors = require('colors');
const kue = require('kue');
const Logger = require('../app/common/logger');
const worker = require('../server/redis/r-jobs');

/*
Start Kue GUI
*/
kue.app.listen(3000);
Logger.module('WORKER').log('Worker UI started on port 3000');

/*
Kue Events
*/
// job enqueue
worker.on('job enqueue', (id, type) => Logger.module('WORKER').log(`[J:${id}] got queued`.yellow));

// job complete
worker.on('job complete', (id, result) => Logger.module('WORKER').log(`[J:${id}] complete`.blue));

// job failed
worker.on('job failed', (id, errorMessage) => Logger.module('WORKER').log(`[J:${id}] has failed: ${errorMessage}`.red));
