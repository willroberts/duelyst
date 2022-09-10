/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * DS209: Avoid top-level return
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// libraries
const path = require('path');
require('app-module-path').addPath(path.join(__dirname, '..'));
const program = require('vorpal')();
const Promise = require('bluebird');
const moment = require('moment');
const ProgressBar = require('progress');
let config = null;
const inquirerPromisifed = require('bluebird-inquirer');
const inquirer = require('inquirer');
const colors = require('colors');
const uuid = require('node-uuid');
const PrettyError = require('pretty-error');
const prettyjson = require('prettyjson');
const Logger = require('app/common/logger');
const Errors = require('server/lib/custom_errors');
const validator = require('validator');
const _ = require('underscore');
const encryptor = require('./lib/crypt.js');
const PaypalTools = require('./lib/paypal-tools');
const fs = require('fs');
const url = require('url');
Promise.promisifyAll(fs);
Promise.promisifyAll(encryptor);

// firebase
const DuelystFirebase = require('server/lib/duelyst_firebase_module');
const FirebasePromises = require('server/lib/firebase_promises');

// data access modules
const InventoryModule = null;
const UsersModule = null;
const SyncModule = null;

// setup globals
let knex = null;

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
				message:`<${config.get('env')}> ${msg} continue? Y/N?`
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

/**
 * console.log data as a table
 * @public
 * @param	{String}	data			data to print out.
 */
const logAsTable = function(dataRows){
	const keys = _.keys(dataRows[0]);
	const Table = require('cli-table');
	const t = new Table({
		head: keys
	});
	_.each(dataRows, function(r){
		let values = _.values(r);
		values = _.map(values, function(v){
			if (v instanceof Date) {
				v = moment(v).format("YYYY-MM-DD");
			}
			return v || "";
		});
		return t.push(values);
	});

	return console.log(t.toString());
};

program
	.version('0.0.1');
	// .option('-d, --debug', 'Enable verbose debug logging')
	// .option('-n, --noprompt', 'Enable/disable confirmation prompts')

program
	.command('config:info')
	.description('print out current config info')
	.action(function(args,callback){
		const configData = JSON.parse(config.toString());
		console.log(prettyjson.render(_.pick(configData,["env","firebase"])));
		return callback();
});

program
	.command('analytics:print_acceptance_data [month] [day] [year]')
	.description('Prints a set of data used for validating analytics')
	.action(function(args,callback){
		const day = args.day || 10;
		const month = args.month || 11;
		const year = args.year || 2015;
		const startOfRange = moment(0).utc().date(day).month(month - 1).year(year);
		const endOfRange = new moment(startOfRange).add(1,'day');

		// Daily revenue data
		const sumRevenuePromise = knex("user_charges")
		.where('created_at','>',startOfRange.toDate()).andWhere('created_at','<',endOfRange.toDate()).sum("amount").then(function(chargeSumData) {
			const revenueSum = chargeSumData[0].sum || 0;
			return Promise.resolve(revenueSum);
		});

		// Daily new users data
		const newUsersCountPromise = knex("users").where('created_at','>',startOfRange.toDate()).andWhere('created_at','<',endOfRange.toDate()).count().then(function(registeredUsersData){
			const count = (registeredUsersData && registeredUsersData[0] && registeredUsersData[0].count) || 0;
			return Promise.resolve(count);
		});

		// May be better to use ended_at
		// Games played
		const gamesPlayedPromise = knex("games").where('created_at','>',startOfRange.toDate()).andWhere('created_at','<',endOfRange.toDate()).count().then(function(gameCountData){
			const count = (gameCountData && gameCountData[0] && gameCountData[0].count) || 0;
			return Promise.resolve(count);
		});

		return Promise.all([sumRevenuePromise,newUsersCountPromise,gamesPlayedPromise])
		.spread(function(sumRevenue, newUsersCount, gamesPlayed) {
			console.log("Analytics data for date " + startOfRange.format("LL"));
			console.log("Sum revenue: " + sumRevenue);
			console.log("New users count: " + newUsersCount);
			console.log("Games Played: " + gamesPlayed);
			return callback();}).catch(function(e){
			console.log(prettyError.render(e));
			return callback(e);
		});
});



/**
 * When configuration is complete, start the command line program
 * @public
 */
const onConfigurationComplete = function(){

	let coloredEnv = config.get('env');
	switch (coloredEnv) {
		case 'production':
			coloredEnv = coloredEnv.toUpperCase().red;
			break;
		case 'staging':
			coloredEnv = coloredEnv.toUpperCase().yellow;
			break;
	}

	const pgUrl = url.parse(config.get('postgres_connection_string'));
	console.log("================".blue);
	console.log("CONFIG: env: "+coloredEnv);
	console.log("CONFIG: firebase: "+url.parse(config.get('firebase')).host);
	console.log("CONFIG: postgres: "+pgUrl.host+pgUrl.pathname);
	console.log("CONFIG: redis: "+config.get('redis.ip'));
	console.log("================".blue);

	// configure knex
	knex = require('knex')({
	  client: 'postgres',
	  connection: config.get('postgres_connection_string'),
	  debug: false //config.isDevelopment()
	});

	// start commander
	// program.parse(process.argv)

	return program
		.delimiter('crm$')
		.show();
};

// console.log process.argv

// check if an environment is specified and make a user pick one if none is provided via NODE_ENV
if (!process.env.NODE_ENV) {

	return fs.readdirAsync(__dirname+'/config')
	.bind({})
	.then(function(files){

		files = _.filter(files,f => f.match(/secret$/));
		let inputChoices = _.map(files, f => f);

		this.environments = inputChoices;

		inputChoices = _.union(["DEVELOPMENT".blue,"LOCAL".yellow,"STAGING".cyan,new inquirer.Separator(),"CANCEL".red,new inquirer.Separator()],inputChoices);

		return inquirerPromisifed.prompt([{
			name:'environment',
			message:"You did not provide an environment via NODE_ENV. Please select one below.",
			type:"list",
			choices:inputChoices
		}]);})

	.then(function(answers){

		const allPromises = [
			Promise.resolve(answers.environment)
		];

		if (answers.environment.match(/secret$/)) {
			allPromises.push(inquirerPromisifed.prompt([{
				name:'passkey',
				message:"Enter environment passkey:",
				type:"password"
			}]));
		}

		return Promise.all(allPromises);}).spread(function(environment,passkeyInput){

		let fn;
		const passkey = passkeyInput != null ? passkeyInput.passkey : undefined;

		if (environment === "CANCEL".red) {

			return process.exit(0);

		} else if (environment === "LOCAL".yellow) {

			process.env.NODE_ENV = 'local';

			// temporarily override log while requiring configuration
			fn = console.log;
			console.log = function(){};
			config = require('config/config');
			console.log = fn;

			config.loadFile(path.join(__dirname, "config/local.json"));
			return onConfigurationComplete();

		} else if (environment === "STAGING".cyan) {

			process.env.NODE_ENV = 'staging';

			// temporarily override log while requiring configuration
			fn = console.log;
			console.log = function(){};
			config = require('config/config');
			console.log = fn;

			config.loadFile(path.join(__dirname, "config/staging.json"));
			return onConfigurationComplete();

		} else if (environment === "DEVELOPMENT".blue) {

			// temporarily override log while requiring configuration
			fn = console.log;
			console.log = function(){};
			config = require('config/config');
			console.log = fn;

			return onConfigurationComplete();

		} else if (environment.match(/secret$/)) {

			// temporarily override log while requiring configuration
			fn = console.log;
			console.log = function(){};
			config = require('config/config');
			console.log = fn;

			return encryptor.decryptFileToDataAsync(`${__dirname}/config/${environment}`, passkey)
			.bind({})
			.then(function(data){
				// load config file
				config.load(JSON.parse(data));
				return onConfigurationComplete();}).catch(function(e){
				console.log(prettyError.render(e));
				return process.exit(1);
			});

		} else {

			console.log("unknown environment... exiting");
			return process.exit(1);
		}
	});

} else {

	config = require('config/config');
	onConfigurationComplete();
}

process.on('uncaughtException', err => console.log('Caught exception: ' + err));
