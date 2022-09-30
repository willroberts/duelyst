exports.up = (knex) => {
  return Promise.all([
    knex.schema.table('referral_codes', table => {
      table.dropColumn('owner_email')
    })
  ])
}

exports.down = (knex) => {
  return Promise.all([
    knex.schema.table('referral_codes',  table => {
      table.string('owner_email', 36)
    })
  ])
}
