/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// libraries
const path = require('path');
require('app-module-path').addPath(path.join(__dirname, '..'));
const program = require('commander');
const Promise = require('bluebird');
const ProgressBar = require('progress');
const config = require('config/config');
const inquirerPromisifed = require('bluebird-inquirer');
const inquirer = require('inquirer');
const colors = require('colors');
const uuid = require('node-uuid');
const PrettyError = require('pretty-error');
const prettyjson = require('prettyjson');
const Logger = require('app/common/logger');
const validator = require('validator');
const _ = require('underscore');
const encryptor = require('./lib/crypt');
const fs = require('fs');
const url = require('url');
Promise.promisifyAll(fs);
Promise.promisifyAll(encryptor);

// setup globals
const env = config.get('env').toUpperCase();

// configure pretty error
const prettyError = new PrettyError();
prettyError.skipNodeFiles();
prettyError.skipPackage('bluebird');

// configure bluebird long stack support
process.env.BLUEBIRD_DEBUG = 1;

// configure logger
Logger.enabled = false;

/**
 * Custom error used by the confirmation prompt promise
 * @class
 */
class DidNotConfirmError extends Error {
	constructor(message) {
		if (message == null) { message = "You did not confirm."; }
		this.message = message;
		this.name = "DidNotConfirmError";
		this.status = 404;
		this.description = "You did not confirm.";
		Error.captureStackTrace(this, DidNotConfirmError);
		super(message);
	}
}

/**
 * Show a general purpose confirmation prompt
 * @public
 * @param	{String}	msg			Custom confirmation message.
 * @return	{Promise}				Promise that will resolve if the user confirms with a 'Y' or reject with DidNotConfirmError otherwise.
 */
const confirmAsync = function(msg){
	if (msg == null) { msg = "..."; }
	return new Promise(function(resolve,reject){
		if (program.noprompt == null) {
			return inquirer.prompt([{
				name:'confirm',
				message:`<${env}> ${msg} continue? Y/N?`
			}],function(answers){
				if (answers.confirm.toLowerCase() === "y") {
					return resolve();
				} else {
					return reject(new DidNotConfirmError());
				}
			});
		} else {
			return resolve();
		}
	});
};

program
	.version('0.0.1')
	.option('-d, --debug', 'Enable verbose debug logging')
	.option('-n, --noprompt', 'Enable/disable confirmation prompts');

program
	.command('generate <filename>')
	.description('generate a secure environment file')
	.action(filename => Promise.resolve()
.bind({})
.then(() => inquirerPromisifed.prompt([{
    name:'passkey',
    message:`Enter passkey for ${filename}:`,
    type:"password"
}]))

.then(function(answers){

    if (!validator.isLength(answers.passkey,6)) {
        throw new Error("passkey must be at least 6 chars long");
    }

    return Promise.all([
        fs.readFileAsync(`${__dirname}/config/${filename}`),
        answers
    ]);})

.spread((data, answers) => encryptor.encryptDataToFileAsync(data, `${__dirname}/config/${filename}.secret`, answers.passkey)).then(function(){

    console.log(("ALL DONE".green));
    return process.exit(0);}).catch(function(e){

    console.log(prettyError.render(e));
    return process.exit(1);
}));

program
	.command('update_passkey <filename>')
	.description('generate a secure environment file')
	.action(filename => Promise.resolve()
.bind({})
.then(() => inquirerPromisifed.prompt([{
    name:'passkey',
    message:`Enter ${"CURRENT".yellow} passkey for ${filename}:`,
    type:"password"
}]))

.then(answers => encryptor.decryptFileToDataAsync(`${__dirname}/config/${filename}.secret`, answers.passkey)).then(function(data){

    console.log(data);

    this.data = data;

    return inquirerPromisifed.prompt([{
        name:'passkey',
        message:`Enter ${"NEW".green} passkey for ${filename}:`,
        type:"password"
    }]);})

.then(function(answers){

    if (!validator.isLength(answers.passkey,6)) {
        throw new Error("passkey must be at least 6 chars long");
    }

    return encryptor.encryptDataToFileAsync(this.data, `${__dirname}/config/${filename}.secret`, answers.passkey);}).then(function(){

    console.log(("ALL DONE".green));
    return process.exit(0);}).catch(function(e){

    console.log(("ERROR".red));
    console.log(prettyError.render(e));
    return process.exit(1);
}));

program
	.command('print <filename> [pretty]')
	.description('print configuration details')
	.action((filename, pretty) => Promise.resolve()
.bind({})
.then(() => inquirerPromisifed.prompt([{
    name:'passkey',
    message:`Enter ${"CURRENT".yellow} passkey for ${filename}:`,
    type:"password"
}]))

.then(answers => encryptor.decryptFileToDataAsync(`${__dirname}/config/${filename}.secret`, answers.passkey)).then(function(data){

    if (pretty) {
        console.log(prettyjson.render(JSON.parse(data)));
    } else {
        console.log(data);
    }

    return process.exit(0);
}));

// start commander
program.parse(process.argv);
