
exports.up = function(knex) {
	return Promise.all([
		knex.schema.table('user_decks', function (table) {
			table.integer('card_back_id')
		})
	])
}

exports.down = function(knex) {
	return Promise.all([
		knex.schema.table('user_decks', function (table) {
			table.dropColumn('card_back_id')
		})
	])
}
