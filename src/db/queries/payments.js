const knex = require('../connection');

/**
 * @typedef {Object} Payment
 * @property {number} payment.id
 * @property {number} payment.user_id
 * @property {string} payment.stripe_id
 * @property {string} payment.stripe_secret
 * @property {string} payment.currency
 * @property {number} payment.amount
 * @property {string} payment.product_data
 * @property {boolean} payment.succeeded
 * @property {string | null} payment.error
 * @property {string} payment.created_at
 */

function getAllPayments() {
  return knex('payments').select('*');
}

/**
 * @param {number|string} prop
 * @param {string} [by]
 */
function getPayment(prop, by = 'id') {
  const where = {};
  where[by] = prop;
  return knex('payments').select('*').where(where);
}

/**
 *
 * @param {number} id
 * @param {Payment} changes
 */
async function editPayment(id, changes) {
  return knex('payments').where({ id }).update(changes).returning('*');
}

/**
 * @param {Payment} payment
 */
async function addPayment(payment) {
  return knex('payments').insert(payment).returning('*');
}

module.exports = {
  getAllPayments,
  getPayment,
  editPayment,
  addPayment,
};
