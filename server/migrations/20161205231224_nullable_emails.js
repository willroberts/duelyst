exports.up = (knex) => {
	return Promise.all([
		knex.raw('ALTER TABLE users ALTER COLUMN email DROP NOT NULL;')
	])
}

exports.down = (knex) => {
	return Promise.all([
		knex.raw('ALTER TABLE users ALTER COLUMN email SET NOT NULL;')
	])
}
