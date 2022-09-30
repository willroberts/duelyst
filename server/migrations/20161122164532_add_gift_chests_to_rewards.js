
exports.up = function(knex) {
	return Promise.all([
		knex.schema.table('user_rewards', function (table) {
			table.specificType('gift_chests','varchar[]')
		})
	])
}

exports.down = function(knex) {
	return Promise.all([
		knex.schema.table('user_rewards', function (table) {
			table.dropColumn('gift_chests')
		})
	])
}
