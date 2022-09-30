
exports.up = function(knex) {
	return Promise.all([
		knex.schema.table('user_decks', function (table) {
			table.integer('color_code').notNullable().defaultTo(knex.raw("0"))
		})
	])
}

exports.down = function(knex) {
	return Promise.all([
		knex.schema.table('user_decks', function (table) {
			table.dropColumn('color_code')
		})
	])
}
