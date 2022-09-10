/* eslint-disable
    func-names,
    import/extensions,
    import/no-unresolved,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
const url 		= require('url');
const _ 			= require('underscore');
const AWS 		= require('aws-sdk');
const Promise 	= require('bluebird');
const colors		= require('colors');
const zlib 		= require('zlib');
const Logger 		= require('../app/common/logger.coffee');
const config 		= require('../config/config.js');

AWS.config.update({
  accessKeyId: config.get('s3_archive.key'),
  secretAccessKey: config.get('s3_archive.secret'),
});

// create a S3 API client
const s3 = new AWS.S3();

const env = config.get('env');

// promisifyAll
// Promise.promisifyAll(s3)

// returns promise for s3 uploaded, takes *serialized* game data
const upload = function (gameId, serializedGameSession, serializedMouseUIEventData) {
  // TODO: Stubbed for now
  Logger.module('S3').debug(`TODO: Fix uploading game ${gameId} to S3`);
  return Promise.resolve('todo-replay-data-link.json');
};

// Logger.module("S3").debug "uploading game #{gameId} to S3"

// bucket = config.get("s3_archive.bucket")
// env = env
// filename = env + "/" + gameId + ".json"
// url = "https://s3-us-west-1.amazonaws.com/" + bucket + "/" + filename

// # promisify
// Promise.promisifyAll(zlib)

// allDeflatePromises = [
// 	zlib.gzipAsync(serializedGameSession)
// ]

// if serializedMouseUIEventData?
// 	allDeflatePromises.push(zlib.gzipAsync(serializedMouseUIEventData))

// return Promise.all(allDeflatePromises)
// .spread (gzipGameSessionData,gzipMouseUIEventData)->
// 	Logger.module("S3").debug "done compressing game #{gameId} for upload"
// 	#
// 	allPromises = []

// 	if gzipGameSessionData?
// 		# upload parameters
// 		params =
// 			Bucket: bucket
// 			Key: filename
// 			Body: gzipGameSessionData
// 			ACL: 'public-read'
// 			ContentEncoding: "gzip"
// 			ContentType: "text/json"
// 		allPromises.push(s3.putObjectAsync(params))

// 	if gzipMouseUIEventData?
// 		# upload parameters
// 		params =
// 			Bucket: bucket
// 			Key: env + "/ui_events/" + gameId + ".json"
// 			Body: gzipMouseUIEventData
// 			ACL: 'public-read'
// 			ContentEncoding: "gzip"
// 			ContentType: "text/json"
// 		allPromises.push(s3.putObjectAsync(params))

// 	return Promise.all(allPromises)
// .spread (gameDataPutResp,mouseDataPutResp)->
// 	return url
// .catch (e)->
// 	Logger.module("S3").error "ERROR uploading game #{gameId} to S3: "#{e.message}
// 	throw e

module.exports = upload;
