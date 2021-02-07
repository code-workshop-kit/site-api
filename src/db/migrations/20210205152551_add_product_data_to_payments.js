exports.up = /** @param {import('knex')} knex */ (knex) => {
  return knex.schema.table('payments', (table) => {
    table.string('product_data', Infinity).notNullable();
  });
};

exports.down = (knex) => {
  return knex.schema.table('payments', (table) => {
    table.dropColumn('product_data');
  });
};
