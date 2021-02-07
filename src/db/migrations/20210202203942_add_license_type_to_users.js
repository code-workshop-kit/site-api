exports.up = /** @param {import('knex')} knex */ (knex) => {
  return knex.schema.table('users', (table) => {
    table
      .enum('license_type', ['free', 'premium', 'investor', 'sponsor'])
      .notNullable()
      .defaultTo('free');
  });
};

exports.down = (knex) => {
  return knex.schema.table('users', (table) => {
    table.dropColumn('license_type');
  });
};
