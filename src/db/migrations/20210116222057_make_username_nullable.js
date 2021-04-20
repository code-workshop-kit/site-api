exports.up = /** @param {import('knex')} knex */ (knex) =>
  knex.schema.alterTable('users', (table) => {
    table.string('username', 32).nullable().alter();
  });

exports.down = (knex) =>
  knex.schema.alterTable('users', (table) => {
    table.string('username', 32).notNullable().alter();
  });
