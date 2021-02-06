const path = require('path');

const BASE_PATH = path.join(__dirname, 'src', 'db');

module.exports = {
  test: {
    client: 'pg',
    connection: `postgres://${process.env.SITE_API_DB_USER}:${process.env.SITE_API_DB_PW}@psql:5432/site_api_test`,
    migrations: {
      directory: path.join(BASE_PATH, 'migrations'),
    },
    seeds: {
      directory: path.join(BASE_PATH, 'seeds'),
    },
  },
  development: {
    client: 'pg',
    connection: `postgres://${process.env.SITE_API_DB_USER}:${process.env.SITE_API_DB_PW}@psql:5432/site_api`,
    migrations: {
      directory: path.join(BASE_PATH, 'migrations'),
    },
    seeds: {
      directory: path.join(BASE_PATH, 'seeds'),
    },
  },
  production: {
    client: 'pg',
    connection: `postgres://${process.env.SITE_API_DB_USER}:${process.env.SITE_API_DB_PW}@localhost:5432/site_api`,
    migrations: {
      directory: path.join(BASE_PATH, 'migrations'),
    },
  },
};
