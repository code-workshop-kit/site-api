const emailValidator = require('email-validator');
const bcrypt = require('bcrypt');
const util = require('util');
const knex = require('../connection');

const genSalt = util.promisify(bcrypt.genSalt);
const hash = util.promisify(bcrypt.hash);
const saltRounds = 10;

/**
 * @typedef {Object} User
 * @property {number} user.id
 * @property {string} user.username
 * @property {string} user.password
 * @property {string} user.password_salt
 * @property {string} user.email
 * @property {string} user.created_at
 * @property {string} user.email_verified
 * @property {string} user.email_verification_token
 * @property {string} user.email_verification_token_expires
 * @property {string} user.password_reset_token
 * @property {string} user.password_reset_token_expires
 */

/**
 * @param {User} user
 */
async function validateUser(user) {
  if (
    !user.username ||
    !user.password ||
    !user.email ||
    typeof user.username !== 'string' ||
    typeof user.password !== 'string' ||
    typeof user.email !== 'string'
  ) {
    return {
      genericError: {
        msg:
          'Sorry, an error has occurred creating your account. Did you fill everything in correctly?',
        error: true,
      },
    };
  }

  const existingUser = await getUser(user.username, 'username');
  const existingEmail = await getUser(user.email, 'email');

  return {
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
  let columns = ['id', 'username', 'email', 'created_at', 'email_verified'];
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
 *
 * @param {number} id
 * @param {User} changes
 */
async function editUser(id, changes) {
  if (changes.id !== undefined || changes.email !== undefined || changes.created_at !== undefined) {
    throw new Error('Attempt was made to edit user properties that are protected');
  }
  if (changes.password) {
    changes.password_salt = await genSalt(saltRounds);
    changes.password = await hash(changes.password, changes.password_salt);
  }
  return knex('users').where({ id }).update(changes).returning(['id', 'username', 'email']);
}

/**
 * If user is added by a third party like Github OAuth, don't validate,
 * because we don't yet set a username/password
 * @param {User} user
 */
async function addUserFromThirdParty(user) {
  return knex('users').insert(user).returning(['id', 'username', 'email', 'created_at']);
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
  addUserFromThirdParty,
  editUser,
};
