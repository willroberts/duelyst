
exports.up = function(knex) {
  return Promise.all([
    knex.schema.table('user_progression', function (table) {
      table.integer('loss_streak').notNullable().defaultTo(knex.raw("0"))
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.table('user_progression', function (table) {
      table.dropColumn('loss_streak')
    })
  ]);
};
