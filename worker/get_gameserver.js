/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const config 		= require('../config/config.js');
const Logger 		= require('../app/common/logger.coffee');
const Colors 		= require('colors');
const Promise 	= require('bluebird');
const request 	= require('superagent');
const _ 			= require('underscore');
const Consul 		= require('../server/lib/consul');

// Returns a promise with the IP of game server if Consul enabled, other null
// Grabs a random active game server for list of available game servers
const getGameServer = function(){
	if (!config.get('consul.enabled')) {
		Logger.module("GAME CREATE").debug("Not assigning to specific server since no CONSUL in environment.".cyan);
		return Promise.resolve(null);
	}

	return Consul.getHealthyServers()
	.then(function(servers) {
		if (servers.length === 0) {
			return Promise.reject(new Error("No servers available."));
		}
		// Grab random node from available servers
		const random_node = _.sample(servers);
		const node_name = random_node["Node"] != null ? random_node["Node"]["Node"] : undefined;
		return Consul.kv.get(`nodes/${node_name}/dns_name`)
		.then(function(dns_name) {
			Logger.module("GAME CREATE").debug(`Connecting players to ${dns_name}`.green);
			return dns_name;
		});
	});
};

module.exports = getGameServer;
