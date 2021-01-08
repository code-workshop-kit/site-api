exports.up = /** @param {import('knex')} knex */ (knex) => {
  return knex.schema.table('users', (table) => {
    table.string('password_reset_token', 128).nullable().defaultTo(null);
    table.datetime('password_reset_token_expires', { precision: 6 }).nullable();
  });
};

exports.down = (knex) => {
  return knex.schema.table('users', (table) => {
    table.dropColumn('password_reset_token');
    table.dropColumn('password_reset_token_expires');
  });
};
