exports.seed = (knex, Promise) => {
  return knex('email_subscriptions')
    .del()
    .then(() => {
      return knex('email_subscriptions').insert({
        email: 'foo@example.com',
      });
    })
    .then(() => {
      return knex('email_subscriptions').insert({
        email: 'bar@gmail.com',
      });
    });
};
