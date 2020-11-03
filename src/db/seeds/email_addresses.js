exports.seed = (knex, Promise) => {
  return knex('email_addresses')
    .del()
    .then(() => {
      return knex('email_addresses').insert({
        email: 'foo@example.com',
      });
    })
    .then(() => {
      return knex('email_addresses').insert({
        email: 'bar@gmail.com',
      });
    });
};
