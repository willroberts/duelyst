exports.up = function(knex) {
    return knex.schema.table('users', function (table) {
        table.string('registration_source')
    })
}

exports.down = function(knex) {
    return knex.schema.table('users', function (table) {
        table.dropColumn('registration_source')
    })
}