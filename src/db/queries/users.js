const emailValidator = require('email-validator');
const bcrypt = require('bcrypt');
const util = require('util');
const knex = require('../connection');

const genSalt = util.promisify(bcrypt.genSalt);
const hash = util.promisify(bcrypt.hash);
const saltRounds = 10;

function validateUser(user) {
  return (
    typeof user.username === 'string' &&
    user.username.length >= 3 &&
    user.username.length <= 32 &&
    emailValidator.validate(user.email) &&
    typeof user.password === 'string' &&
    user.password.length >= 8 &&
    user.password.length <= 128
  );
}

function getAllUsers() {
  return knex('users').select('*');
}

function getUser(idOrName) {
  if (typeof idOrName === 'number') {
    return knex('users').select('*').where({ id: idOrName });
  }
  return knex('users').select('*').where({ username: idOrName });
}

async function addUser(user) {
  if (!validateUser(user)) {
    throw new Error('Given user is not a valid user');
  }

  user.password_salt = await genSalt(saltRounds);
  user.password = await hash(user.password, user.password_salt);

  return knex('users').insert(user).returning(['username', 'email', 'created_at']);
}

module.exports = {
  getAllUsers,
  getUser,
  addUser,
};
