const emailValidator = require('email-validator');
const bcrypt = require('bcrypt');
const util = require('util');
const knex = require('../connection');

const genSalt = util.promisify(bcrypt.genSalt);
const hash = util.promisify(bcrypt.hash);
const saltRounds = 10;

/**
 * @typedef {Object} User
 * @property {string} user.username
 * @property {string} user.password
 * @property {string} user.email
 */

/**
 * @param {User} user
 */
async function validateUser(user) {
  const existingUser = await getUser(user.username, 'username');
  const existingEmail = await getUser(user.email, 'email');

  return {
    genericError: {
      msg: 'Sorry, an error has occurred creating your account.',
      error: typeof user.username !== 'string' || typeof user.password !== 'string',
    },
    usernameTooShort: {
      msg: 'Username is too short. Please enter a username with 4 or more characters.',
      error: user.username.length < 4,
    },
    usernameTooLong: {
      msg: 'Username is too long. Please enter a username with 32 or less characters.',
      error: user.username.length > 32,
    },
    usernameExists: {
      msg: 'Username already exists.',
      error: existingUser.length > 0,
    },
    emailInvalid: {
      msg: 'Email address is not a valid email address.',
      error: !emailValidator.validate(user.email),
    },
    emailExists: {
      msg: 'Email address is already registered.',
      error: existingEmail.length > 0,
    },
    passwordTooShort: {
      msg: 'Password is too short. Please enter a password with 8 or more characters.',
      error: user.password.length < 8,
    },
    passwordTooLong: {
      msg: 'Password is too long. Please enter a password with 128 or less characters.',
      error: user.password.length > 128,
    },
  };
}

function getAllUsers() {
  return knex('users').select('*');
}

/**
 * @param {number|string} prop
 * @param {string} [by]
 * @param {boolean} [all]
 */
function getUser(prop, by = 'id', all = false) {
  let columns = ['id', 'username', 'email', 'created_at'];
  // If requested 'all', return all columns incl. passwords etc.
  if (all) {
    columns = '*';
  }
  const where = {};
  where[by] = prop;
  return knex('users')
    .select(...columns)
    .where(where);
}

/**
 * @param {User} user
 */
async function addUser(user) {
  const validationResult = await validateUser(user);
  const errors = Object.entries(validationResult)
    .filter((entry) => entry[1].error)
    .map((entry) => entry[1].msg);

  if (errors.length > 0) {
    return errors;
  }

  user.password_salt = await genSalt(saltRounds);
  user.password = await hash(user.password, user.password_salt);

  return knex('users').insert(user).returning(['id', 'username', 'email', 'created_at']);
}

module.exports = {
  getAllUsers,
  getUser,
  addUser,
};
