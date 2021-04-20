exports.up = /** @param {import('knex')} knex */ (knex) =>
  knex.schema.table('users', (table) => {
    table.integer('github_id').unique().nullable().defaultTo(null);
  });

exports.down = (knex) =>
  knex.schema.table('users', (table) => {
    table.dropColumn('github_id');
  });
