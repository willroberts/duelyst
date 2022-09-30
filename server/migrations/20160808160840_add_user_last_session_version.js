
exports.up = function(knex) {
	return Promise.all([
		knex.schema.table('users', function (table) {
			table.string('last_session_version')
		})
	])
}

exports.down = function(knex) {
	return Promise.all([
		knex.schema.table('users', function (table) {
			table.dropColumn('last_session_version')
		})
	])
}
