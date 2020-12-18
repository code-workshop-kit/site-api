exports.up = /** @param {import('knex')} knex */ (knex, Promise) => {
  return knex.schema.createTable('email_subscriptions', (table) => {
    table.increments();
    table.string('email').notNullable().unique();
  });
};

exports.down = /** @param {import('knex')} knex */ (knex, Promise) => {
  return knex.schema.dropTable('email_subscriptions');
};
