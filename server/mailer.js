/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let base_url;
const fs = require('fs');
const os = require('os');
const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('hbs');
const {
    handlebars
} = hbs;
const config = require('../config/config.js');

// Pretty error printing, helps with stack traces
const PrettyError = require('pretty-error');
const prettyError = new PrettyError();
prettyError.skipNodeFiles();
prettyError.withoutColors();
prettyError.skipPackage('bluebird');

const env = config.get('env');
if (env === 'development') {
	base_url = `http://localhost:${config.get('port')}`;
} else if (env === 'staging') {
	base_url = "";
} else if (env === 'production') {
	base_url = "";
}

class Email {

	constructor() {
		this.loadTemplates();

		this.transporter = nodemailer.createTransport({
			host: 'smtp.mandrillapp.com',
			port: 587,
			auth: {
				user: '',
				pass: ''
			}
		});
	}

	loadTemplates() {
		try {
			this.default_template = fs.readFileSync(__dirname + '/templates/email-default.hbs').toString();
			this.signup_template = fs.readFileSync(__dirname + '/templates/email-signup.hbs').toString();
			this.resend_template = fs.readFileSync(__dirname + '/templates/email-resend.hbs').toString();
			this.taken_template =  fs.readFileSync(__dirname + '/templates/email-taken.hbs').toString();
			this.forgot_template = fs.readFileSync(__dirname + '/templates/email-forgot.hbs').toString();
			this.verify_template = fs.readFileSync(__dirname + '/templates/email-verify.hbs').toString();
			this.confirm_template = fs.readFileSync(__dirname + '/templates/email-confirm.hbs').toString();
			this.alert_template = fs.readFileSync(__dirname + '/templates/email-alert.hbs').toString();
			this.steam_alert_template = fs.readFileSync(__dirname + '/templates/email-steam-alert.hbs').toString();
			this.notify_template = fs.readFileSync(__dirname + '/templates/email-notify.hbs').toString();
			this.receipt_template = fs.readFileSync(__dirname + '/templates/email-receipt.hbs').toString();
			return this.giftcrate_template = fs.readFileSync(__dirname + '/templates/email-giftcrate.hbs').toString();
		} catch (e) {
			throw new Error("Failed to load email templates.");
		}
	}

	sendMail(username, email, title, message, cb) {
		const template = handlebars.compile(this.default_template);
		const html = template({title, base_url, username, message});
		const opts = {
			from: 'support@duelyst.com',
			to: email,
			subject: `DUELYST - ${title}`,
			html
			// plaintext fallback
			// text: ''
		};

		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendEmailVerificationLink(username, email, token, cb) {
		const template = handlebars.compile(this.verify_template);
		const html = template({title: 'Verify Email', base_url, username, token});
		const opts = {
			from: 'support@duelyst.com',
			to: email,
			subject: "Verify your DUELYST account email",
			html
			// plaintext fallback
			// text: ''
		};

		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendSignup(username, email, token, cb) {
		const template = handlebars.compile(this.signup_template);
		const html = template({title: 'Welcome', base_url, username, token});
		const opts = {
			from: 'support@duelyst.com',
			to: email,
			subject: "Welcome to DUELYST",
			html
			// plaintext fallback
			// text: ''
		};

		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendReceipt(username, email, receiptNumber, boosterCount, cb) {
		const template = handlebars.compile(this.receipt_template);
		const html = template({title: 'Welcome', base_url, username, receipt_number: receiptNumber, booster_count:boosterCount});
		const opts = {
			from: 'support@duelyst.com',
			to: email,
			subject: "DUELYST Purchase Receipt",
			html
			// plaintext fallback
			// text: ''
		};

		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	resendSignup(username, email, token, cb) {
		const template = handlebars.compile(this.resend_template);
		const html = template({title: 'Confirm', base_url, username, token});
		const opts = {
			from: 'support@duelyst.com',
			to: email,
			subject: "Duelyst - Complete your registration",
			html
			// plaintext fallback
			// text: ''
		};

		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendTakenEmail(username, email, token, cb) {
		const template = handlebars.compile(this.taken_template);
		const html = template({title: 'Taken', username, token});
		const opts = {
			from: 'support@duelyst.com',
			to: email,
			subject: "Duelyst - Email already registered",
			html
			// plaintext fallback
			// text: ''
		};

		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendForgotPassword(username, email, token, cb) {
		const template = handlebars.compile(this.forgot_template);
		const html = template({title: 'Reset', base_url, username, token});
		const opts = {
			from: 'support@duelyst.com',
			to: email,
			subject: "Duelyst - Reset your password",
			html
			// plaintext fallback
			// text: ''
		};
		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendPasswordConfirmation(username, email, cb) {
		const template = handlebars.compile(this.confirm_template);
		const html = template({title: 'Reset', base_url, username});
		const opts = {
			from: 'support@duelyst.com',
			to: email,
			subject: "Duelyst - Password has been updated",
			html
			// plaintext fallback
			// text: ''
		};
		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendNotification(title, message, cb) {
		const template = handlebars.compile(this.notify_template);
		const html = template({title, message});
		const opts = {
			from: "admin@duelyst.com",
			to: `servers+${env}@counterplay.co`,
			subject: `[${env}] Duelyst - NOTIFICATION - ${title}`,
			html
			// plaintext fallback
			// text: ''
		};
		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendTeamPurchaseNotification(username, userId, email, chargeId, price, cb) {
		const opts = {
			from: "admin@counterplay.co",
			to: "purchase-notifications@counterplay.co",
			subject: `[${env}] Duelyst - PURCHASE - ${username} spent ${price} - ${chargeId}`,
			html: `${username} (email:${email}) (id:${userId}) spent ${price}. Charge ID ${chargeId}`
			// plaintext fallback
			// text: ''
		};
		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendTeamPurchaseErrorNotification(subject, message, cb) {
		const opts = {
			from: "admin@counterplay.co",
			to: "purchase-error-notifications@counterplay.co",
			subject: `[${env}] Duelyst - NOTIFICATION - ${subject}`,
			html: message
			// plaintext fallback
			// text: ''
		};
		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendErrorAlert(server, error, cb) {
		const template = handlebars.compile(this.alert_template);
		const html = template({title: 'Server Error', base_url, server: JSON.stringify(server), error});
		const opts = {
			from: "admin@duelyst.com",
			to: `server-errors+${env}@counterplay.co`,
			subject: `[${env}] Duelyst - SERVER ALERT! ${server.hostname}`,
			html
			// plaintext fallback
			// text: ''
		};
		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendCrashAlert(server, error, cb) {
		const prettyErrorInfo = prettyError.render(error);
		const template = handlebars.compile(this.alert_template);
		const html = template({title: 'Server Crash', base_url, server: JSON.stringify(server), error, prettyErrorInfo});
		const opts = {
			from: "admin@duelyst.com",
			to: `server-alerts+${env}@counterplay.co`,
			subject: `[${env}] Duelyst - SERVER CRASH! ${server.hostname}`,
			html
			// plaintext fallback
			// text: ''
		};
		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendSteamAlert(txn, server, error, cb) {
		const template = handlebars.compile(this.steam_alert_template);
		const html = template({
			title: 'Steam Transaction Error',
			base_url,
			txn: JSON.stringify(txn),
			server: JSON.stringify(server),
			error
		});
		const opts = {
			from: "admin@duelyst.com",
			to: `server-errors+${env}@counterplay.co`,
			subject: `[${env}] Duelyst - Steam Transaction Error! ${server.hostname}`,
			html
		};
		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendPlayerReport(playerUsername, playerId, message, fromUserId, fromEmail = null, cb) {
		const opts = {
			from: fromEmail || "admin@duelyst.com",
			to: "player-abuse-reports@counterplay.co",
			subject: `[${env}] REPORT: ${playerUsername} (${playerId}) reported`,
			text: `${message}\n\n =============== \n\n by ${fromUserId}`
		};

		return this.transporter.sendMail(opts, function(error, info) {
			if (cb != null) {
				if (error) {
					return cb(error);
				} else {
					return cb(null, info.response);
				}
			}
		});
	}

	sendCRMActivityReport(subject, htmlMessage, cb){

		const opts = {
			from: "admin@duelyst.com",
			to: `servers+${env}@counterplay.co`,
			subject: `[${env}] Duelyst - CRM ACTIVITY - ${subject}`,
			html: htmlMessage
		};
		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}

	sendGiftCrate(username, email, cb) {
		const template = handlebars.compile(this.giftcrate_template);
		const html = template({title: 'Come unlock your FREE gift crate', base_url, username});
		const opts = {
			from: 'DUELYST <support@duelyst.com>',
			to: email,
			subject: "FREE Duelyst Gift Crate",
			html
		};

		return this.transporter.sendMail(opts, function(error, info) {
			if (error) {
				return cb(error);
			} else {
				return cb(null, info.response);
			}
		});
	}
}

module.exports = new Email;
