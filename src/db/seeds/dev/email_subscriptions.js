exports.seed = (knex) =>
  knex('email_subscriptions')
    .del()
    .then(() =>
      knex('email_subscriptions').insert({
        email: 'foo@example.com',
      }),
    )
    .then(() =>
      knex('email_subscriptions').insert({
        email: 'bar@gmail.com',
      }),
    );
