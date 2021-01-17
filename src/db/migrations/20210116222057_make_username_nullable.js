exports.up = /** @param {import('knex')} knex */ (knex) => {
  return knex.schema.alterTable('users', (table) => {
    table.string('username', 32).nullable().alter();
  });
};

exports.down = (knex) => {
  return knex.schema.alterTable('users', (table) => {
    table.string('username', 32).notNullable().alter();
  });
};
