const knex = require('../connection');
const validator = require('email-validator');

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

module.exports = {
  getAllEmailAddresses,
  getEmailAddress,
  addEmailAddress,
};