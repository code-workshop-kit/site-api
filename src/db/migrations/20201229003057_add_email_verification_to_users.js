exports.up = /** @param {import('knex')} knex */ (knex) =>
  knex.schema.table('users', (table) => {
    table.boolean('email_verified').defaultTo(false);
    table.string('email_verification_token', 128).nullable().defaultTo(null);
    table.datetime('email_verification_token_expires', { precision: 6 }).nullable();
  });

exports.down = (knex) =>
  knex.schema.table('users', (table) => {
    table.dropColumn('email_verified');
    table.dropColumn('email_verification_token');
    table.dropColumn('email_verification_token_expires');
  });
