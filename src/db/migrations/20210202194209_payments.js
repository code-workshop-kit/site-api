exports.up = /** @param {import('knex')} knex */ (knex) =>
  knex.schema.createTable('payments', (table) => {
    table.increments();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users');
    table.string('stripe_id').notNullable().unique();
    table.string('stripe_secret').notNullable().unique();
    table.string('currency').notNullable();
    table.integer('amount').notNullable();
    table.boolean('succeeded').defaultTo(false);
    table.string('error').defaultTo(null);
    table.datetime('created_at').notNullable();
  });

exports.down = (knex) => knex.schema.dropTable('payments');
