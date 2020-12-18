const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const queries = require('./db/queries/users.js');

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(async function (user, done) {
  try {
    const users = await queries.getUser(user.id);
    console.log('Logged in as', users[0].username);
    done(null, users[0]);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new LocalStrategy(function (username, password, done) {
    queries
      .getUser(username)
      .then((users) => {
        const user = users[0];
        bcrypt.compare(password, user.password, (err, result) => {
          if (result) {
            console.log('Logging in!');
            done(null, user);
          } else {
            done(null, false, { message: `Error logging in: ${err}` });
          }
        });
      })
      .catch((err) => done(err));
  }),
);
