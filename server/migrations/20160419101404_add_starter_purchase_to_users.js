exports.up = function(knex) {
  return knex.schema.table('users', function (table) {
    table.boolean('has_purchased_starter_bundle')
  })
}

exports.down = function(knex) {
  return knex.schema.table('users', function (table) {
    table.dropColumn('has_purchased_starter_bundle')
  })
}
