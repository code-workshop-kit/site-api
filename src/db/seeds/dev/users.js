require('dotenv').config();
const bcrypt = require('bcrypt');

const stripe = require('stripe')(process.env.STRIPE_TEST_KEY);

const generateSaltHash = (pwText) => {
  const saltRounds = 10;
  // For seeding, sync is fine.. no need to do async
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(pwText, salt);
  return { salt, hash };
};

/**
 * Delete payments first before deleting users.
 * Insert users first before inserting payments.
 * This is necessary due to the foreign key constraint in payments, on user id
 *
 * @param {import('knex')} knex
 * @param {Promise<void>} Promise
 */
exports.seed = (knex, Promise) => {
  return knex('payments')
    .del()
    .then(() => knex('users').del())
    .then(() => {
      const { salt, hash } = generateSaltHash('pineapples');
      return knex('users').insert({
        username: 'foofoo',
        email: 'foofoo@example.com',
        password: hash,
        password_salt: salt,
      });
    })
    .then(() => {
      const { salt, hash } = generateSaltHash('potatoes');
      return knex('users').insert({
        username: 'barbar',
        email: 'barbar@example.com',
        password: hash,
        password_salt: salt,
      });
    })
    .then(async () => {
      const amount = 2599;
      const currency = 'eur';
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: { purpose: 'db_seed' },
      });
      return knex('payments').insert({
        user_id: 1,
        stripe_id: paymentIntent.id,
        stripe_secret: paymentIntent.client_secret,
        currency,
        amount,
        product_data: JSON.stringify([{ id: 'license_premium', amount: 1 }]),
        created_at: new Date(paymentIntent.created * 1000).toISOString(),
      });
    })
    .then(async () => {
      const amount = 9999;
      const currency = 'eur';
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: { purpose: 'db_seed' },
      });
      return knex('payments').insert({
        user_id: 1,
        stripe_id: paymentIntent.id,
        stripe_secret: paymentIntent.client_secret,
        currency,
        amount,
        product_data: JSON.stringify([{ id: 'license_premium', amount: 1 }]),
        created_at: new Date(paymentIntent.created * 1000).toISOString(),
      });
    })
    .then(async () => {
      const amount = 1234;
      const currency = 'eur';
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: { purpose: 'db_seed' },
      });
      return knex('payments').insert({
        user_id: 2,
        stripe_id: paymentIntent.id,
        stripe_secret: paymentIntent.client_secret,
        currency,
        amount,
        product_data: JSON.stringify([{ id: 'license_premium', amount: 1 }]),
        created_at: new Date(paymentIntent.created * 1000).toISOString(),
      });
    });
};
