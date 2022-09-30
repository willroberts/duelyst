
exports.up = function(knex) {
	return Promise.all([
		knex.schema.table('user_faction_progression', function (table) {
			table.integer('friendly_win_count').notNullable().defaultTo(0)
		})
	])
}

exports.down = function(knex) {
	return Promise.all([
		knex.schema.table('user_faction_progression', function (table) {
			table.dropColumn('friendly_win_count')
		})
	])
}
