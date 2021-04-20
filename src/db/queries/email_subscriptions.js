const validator = require('email-validator');
const knex = require('../connection');

function getAllEmailAddresses() {
  return knex('email_subscriptions').select('*');
}

function getEmailAddress(email) {
  return knex('email_subscriptions').select('*').where({ email });
}

function addEmailAddress(email) {
  if (!validator.validate(email)) {
    throw new Error('Given email is not a valid email address');
  }
  // Insert or overwrite duplicates
  return knex('email_subscriptions').insert({ email }).onConflict('email').merge().returning('*');
}

function removeEmailAddress(email) {
  return knex('email_subscriptions').where({ email }).del().returning('*');
}

module.exports = {
  getAllEmailAddresses,
  getEmailAddress,
  addEmailAddress,
  removeEmailAddress,
};
