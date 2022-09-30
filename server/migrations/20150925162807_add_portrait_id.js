
exports.up = function(knex) {
  return Promise.all([
    knex.schema.table('users', function (table) {
      table.integer('portrait_id');
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.table('users', function (table) {
      table.dropColumn('portrait_id');
    })
  ]);
};
