/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const qs = require('querystring');
const prettyjson = require('prettyjson');
const moment = require('moment');

module.exports = {};
module.exports.paypalNvpSearchResponseToObjects = function(data){

	const response = qs.parse(data.toString());
	if (response["L_TYPE100"]) {
		throw new Error("possibly too many responses");
	}

	const items = [];

	if (response.ACK === 'Failure') {
		console.log('ERROR'.red);
		console.log(prettyjson.render(response));
	} else {
		for (let i = 0; i < 100; i++) {
			if (response[`L_TYPE${i}`] != null) {
				items.push({
					type: response[`L_TYPE${i}`],
					amount: response[`L_AMT${i}`],
					email: response[`L_EMAIL${i}`],
					status: response[`L_STATUS${i}`],
					id: response[`L_TRANSACTIONID${i}`],
					currency: response[`L_CURRENCYCODE${i}`],
					name: response[`L_NAME${i}`],
					date: moment(response[`L_TIMESTAMP${i}`])
				});
			}
		}
	}

	return items;
};

module.exports.paypalNvpTransactionResponseToObject = function(data){

	const response = qs.parse(data.toString());
	return response;
};
