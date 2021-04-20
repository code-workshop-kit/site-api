exports.up = /** @param {import('knex')} knex */ (knex) =>
  knex.schema.table('users', (table) => {
    table
      .enum('license_type', ['free', 'premium', 'investor', 'sponsor'])
      .notNullable()
      .defaultTo('free');
  });

exports.down = (knex) =>
  knex.schema.table('users', (table) => {
    table.dropColumn('license_type');
  });
