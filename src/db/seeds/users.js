const bcrypt = require('bcrypt');

const generateSaltHash = (pwText) => {
  const saltRounds = 10;
  // For seeding, sync is fine.. no need to do async
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(pwText, salt);
  return { salt, hash };
};

exports.seed = /** @param {import('knex')} knex */ (knex, Promise) => {
  return knex('users')
    .del()
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
};
