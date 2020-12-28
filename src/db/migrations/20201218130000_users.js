exports.up = /** @param {import('knex')} knex */ (knex, Promise) => {
  return knex.schema.createTable('users', (table) => {
    table.increments();
    table.string('username', 32).notNullable().unique();
    table.string('email').notNullable().unique();
    table.string('password_salt', 128).notNullable().unique();
    table.string('password', 128).notNullable();
    table.datetime('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));
    table.boolean('email_verified').defaultTo(false);
    table.string('email_verification_token', 128).nullable().defaultTo(null);
    table.datetime('email_verification_token_expires', { precision: 6 }).nullable();
  });
};

exports.down = /** @param {import('knex')} knex */ (knex, Promise) => {
  return knex.schema.dropTable('users');
};
