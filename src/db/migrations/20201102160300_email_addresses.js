exports.up = (knex, Promise) => {
  return knex.schema.createTable('email_addresses', (table) => {
    table.increments();
    table.string('email').notNullable().unique();
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('email_addresses');
};
