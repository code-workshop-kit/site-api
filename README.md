# CWK Site API

Just a tiny REST API based on Koa, Knex.js, PostgreSQL. Needed to store email addresses for those who want to stay updated on CWK stuff.

## How to run it

I haven't set up Docker yet... but for a Linux Ubuntu (WSL2), this is what I did to set up PostgreSQL:

- Follow this guide to installing [PostgreSQL on Linux Ubuntu](https://www.postgresql.org/download/linux/ubuntu/) from the official site
- `sudo systemctl start postgresql` if needed
- `sudo -i -u postgres`
-  `psql`
- `create user myuser superuser with encrypted password 'mypass';`
- `create database myuser;`
- `grant all privileges on database myuser to myuser;`
- `create database cwk_site_api;`
- `create database cwk_site_api_test;`
- `grant all privileges on database cwk_site_api to muser;`
- `grant all privileges on database cwk_site_api_test to muser;`
- `\q` to quit psql
- switch back to your user
- `psql` should now work and log you in as your user
- Change knexfile.js to your credentials. Obviously the one committed to git is not what will be on final server ;) I will change it to use an ENV variable later..
- `npx knex migrate:latest --env development`
- `npx knex migrate:latest --env test`
- `npx knex seed:run --env development`
- `npx knex seed:run --env test`
- `npm start`

Then you should be good to go. Use for example Postman to do a POST request to `http://localhost:3000/api/subscribe-updates` with body:

```json
{
  "email": "pineapples@example.com"
}
```

Then verify that it was added if you like:

- `psql`
- `\c cwk_site_api`
- `select * from email_addresses;`

Tips: in `psql` you can use `\l` to get list of databases and some info. `\dt` to get tables in a database after connecting to it with `\c`.
