/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const os = require('os');
const Logger = require('../app/common/logger');
const Promise = require('bluebird');
const mail = require('./mailer');
Promise.promisifyAll(mail);

// Pretty error printing, helps with stack traces
const PrettyError = require('pretty-error');
const pe = new PrettyError();
pe.skipNodeFiles();

// Configuration object
const config = require('../config/config.js');

/**
 * Shutdown server process with an unhandled error
 * Will trigger alerts by with exceptionReporter, email
 * @public errorShutdown
 * @param {Error} err
 */
module.exports.errorShutdown = function(err) {
	Logger.module("SHUTDOWN").error(pe.render(err));

	if (config.isDevelopment()) {
		process.exit(1);
	}

	// Server info to include with email alert
	const serverInfo = {
		hostname: os.hostname(),
		environment: config.get('env'),
		freemem: os.freemem(),
		totalmem: os.totalmem()
	};

	return mail.sendCrashAlertAsync(serverInfo, err)
	.timeout(2500)
	.then(() => Logger.module("SHUTDOWN").debug("Email alert sent.")).catch(() => Logger.module("SHUTDOWN").error("Failed to send email alert.")).delay(1000)
	.then(() => process.exit(1));
};
