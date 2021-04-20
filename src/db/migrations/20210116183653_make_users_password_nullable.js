exports.up = /** @param {import('knex')} knex */ (knex) =>
  knex.schema.alterTable('users', (table) => {
    table.string('password_salt', 128).nullable().alter();
    table.string('password', 128).nullable().alter();
  });

exports.down = (knex) =>
  knex.schema.alterTable('users', (table) => {
    table.string('password_salt', 128).notNullable().alter();
    table.string('password', 128).notNullable().alter();
  });
