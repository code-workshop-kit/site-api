exports.up = /** @param {import('knex')} knex */ (knex) =>
  knex.schema.createTable('email_subscriptions', (table) => {
    table.increments();
    table.string('email').notNullable().unique();
  });

exports.down = /** @param {import('knex')} knex */ (knex) =>
  knex.schema.dropTable('email_subscriptions');
