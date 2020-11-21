const environment = process.env.NODE_ENV || 'development';
const config = require('../../knexfile.js')[environment];

console.log(config.connection);

module.exports = require('knex')(config);
