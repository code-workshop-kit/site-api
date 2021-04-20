exports.up = /** @param {import('knex')} knex */ (knex) =>
  knex.schema.table('payments', (table) => {
    table.string('product_data', Infinity).notNullable();
  });

exports.down = (knex) =>
  knex.schema.table('payments', (table) => {
    table.dropColumn('product_data');
  });
