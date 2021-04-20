exports.up = /** @param {import('knex')} knex */ (knex) =>
  knex.schema.createTable('users', (table) => {
    table.increments();
    table.string('username', 32).notNullable().unique();
    table.string('email').notNullable().unique();
    table.string('password_salt', 128).notNullable().unique();
    table.string('password', 128).notNullable();
    table.datetime('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));
  });

exports.down = /** @param {import('knex')} knex */ (knex) => knex.schema.dropTable('users');
