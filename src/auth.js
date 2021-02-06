const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
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

const getGithubEmail = async (accessToken) => {
  const emails = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `token ${accessToken}`,
    },
  });
  const emailsResult = await emails.json();
  const githubEmail = emailsResult.find(
    (email) =>
      email.primary === true &&
      email.verified === true &&
      !email.email.endsWith('noreply.github.com'),
  );
  return githubEmail;
};

const callbackURL =
  process.env.NODE_ENV === 'production'
    ? 'https://code-workshop-kit.com/api/auth/github/callback'
    : 'http://localhost:3000/api/auth/github/callback';

const clientID =
  process.env.NODE_ENV === 'production'
    ? process.env.GITHUB_CLIENT_ID
    : process.env.GITHUB_CLIENT_ID_DEV;

const clientSecret =
  process.env.NODE_ENV === 'production'
    ? process.env.GITHUB_CLIENT_SECRET
    : process.env.GITHUB_CLIENT_SECRET_DEV;

if (process.env.NODE_ENV !== 'test') {
  passport.use(
    new GitHubStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        const [userByGithubId] = await queries.getUser(profile.id, 'github_id');
        if (userByGithubId) {
          done(null, userByGithubId);
        } else {
          let githubEmail = await getGithubEmail(accessToken);
          if (!githubEmail) {
            done(null, false, { message: `GitHub account has no verified email address` });
          } else {
            githubEmail = githubEmail.email;
            let [userByEmail] = await queries.getUser(githubEmail, 'email');
            if (userByEmail) {
              userByEmail = await queries.editUser(userByEmail.id, { github_id: profile.id });
              userByEmail = userByEmail[0];
              done(null, userByEmail);
            } else {
              const [newUser] = await queries.addUserFromThirdParty({
                github_id: profile.id,
                email: githubEmail,
                email_verified: true,
              });
              done(null, newUser);
            }
          }
        }
        done(null, false, { message: `Error logging in with GitHub OAuth 2.0.` });
      },
    ),
  );
}
