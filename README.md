# CWK Site API

Just a tiny REST API based on Koa, Knex.js, PostgreSQL. Needed to store email addresses for those who want to stay updated on CWK stuff.

## How to run it

- Edit the `docker-compose.yml` if you want to change some environment variables. The docker env vars are fine to share since they are different from prod and don't give access to anything other than your local docker container and app.
- `docker-compose up -d`
- `npm run docker:seed` to migrate if necessary & seed the database tables
- See Environment Variables section

Then you should be good to go. Use Postman for example to do a GET request to `http://localhost:3000/api/users/1`

Shut it down with `docker-compose down`

## Tests

`npm run docker:test`

## Prod

For production, not using Docker at the moment.

- Setup PostgreSQL manually
- Setup Apache2 + proxy to route /api --> port 3000 (app port)
- Using pm2 to manage the app process
- See Environment Variables section

## Environment Variables

The app uses a bunch of env variables with things like secrets and API keys.

For the app to work fully, set env variables in a `.env` file:

- APP_KEY (auth/session)
- MAILGUN_KEY (emails)
- RECAPTCHA_KEY (recaptcha)
- GITHUB_CLIENT_ID_DEV (github auth)
- GITHUB_CLIENT_SECRET_DEV (github auth)
- STRIPE_TEST_KEY (stripe payments)
- STRIPE_PUBLISHABLE_TEST_KEY (stripe payments)
- STRIPE_ENDPOINT_SECRET (stripe payments)
- SITE_API_DB_USER (database credentials)
- SITE_API_DB_PW (database credentials)