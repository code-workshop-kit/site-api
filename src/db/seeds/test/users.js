require('dotenv').config();
const bcrypt = require('bcrypt');

const generateSaltHash = (pwText) => {
  const saltRounds = 10;
  // For seeding, sync is fine.. no need to do async
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(pwText, salt);
  return { salt, hash };
};

/**
 * Don't seed payments, it is unnecessary and uses Stripe API
 * so let's save everyone the traffic :)
 *
 * @param {import('knex')} knex
 * @param {Promise<void>} Promise
 */
exports.seed = (knex) =>
  knex('payments')
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
    });
