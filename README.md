# CWK Site API

Just a tiny REST API based on Koa, Knex.js, PostgreSQL. Needed to store email addresses for those who want to stay updated on CWK stuff.

## How to run it

- Edit the `docker-compose.yml` if you want to change some environment variables. For sendgrid emailing to work, you need to add CWK_SENDGRID_KEY to a .env file locally, for obvious reasons I'm not sharing that key in git ;). The docker env vars are fine to share since they are different from prod and don't give access to anything other than your local docker container and app.
- `docker-compose up -d`
- `npm run docker:seed` to migrate if necessary & seed the database tables

Then you should be good to go. Use Postman for example to do a GET request to `http://localhost:3000/api/users/1`

Shut it down with `docker-compose down`

## Tests

`npm run docker:test`

## Prod

For production, not using Docker at the moment.

- Setup PostgreSQL manually
- Setup Apache2 + proxy to route /api --> port 3000 (app port)
- Using pm2 to manage the app process
- Set env variables in a `.env` file:
  - CWK_APP_KEY
  - CWK_SITE_API_DB_USER
  - CWK_SITE_API_DB_PW
  - CWK_SENDGRID_KEY