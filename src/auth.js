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
    done(null, users[0]);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new LocalStrategy(function (username, password, done) {
    queries
      .getUser(username, 'username', true)
      .then((users) => {
        const user = users[0];
        if (!user) {
          done(null, false, { message: `No user with that name exists.` });
          return;
        }
        bcrypt.compare(password, user.password, (err, result) => {
          if (result) {
            // Don't send forth user pws now that we checked if password is correct
            delete user.password;
            delete user.password_salt;
            done(null, user);
          } else {
            done(null, false, { message: `Error logging in: ${err}` });
          }
        });
      })
      .catch((err) => done(err));
  }),
);
