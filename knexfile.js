const path = require('path');

const BASE_PATH = path.join(__dirname, 'src', 'db');

module.exports = {
  test: {
    client: 'pg',
    connection: 'postgres://joren:pineapples@localhost:5432/cwk_site_api_test',
    migrations: {
      directory: path.join(BASE_PATH, 'migrations'),
    },
    seeds: {
      directory: path.join(BASE_PATH, 'seeds'),
    },
  },
  development: {
    client: 'pg',
    connection: 'postgres://joren:pineapples@localhost:5432/cwk_site_api',
    migrations: {
      directory: path.join(BASE_PATH, 'migrations'),
    },
    seeds: {
      directory: path.join(BASE_PATH, 'seeds'),
    },
  },
  production: {
    client: 'pg',
    // TODO: Put real password here, but of course as an ENV variable hidden from git :)
    connection: 'postgres://joren:pineapples@localhost:5432/cwk_site_api',
    migrations: {
      directory: path.join(BASE_PATH, 'migrations'),
    },
  },
};
