exports.up = /** @param {import('knex')} knex */ (knex) => {
  return knex.schema.alterTable('users', (table) => {
    table.string('password_salt', 128).nullable().alter();
    table.string('password', 128).nullable().alter();
  });
};

exports.down = (knex) => {
  return knex.schema.alterTable('users', (table) => {
    table.string('password_salt', 128).notNullable().alter();
    table.string('password', 128).notNullable().alter();
  });
};
