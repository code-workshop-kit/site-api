const Router = require('koa-router');
const passport = require('koa-passport');
const { promisify } = require('util');
const crypto = require('crypto');
const fetch = require('node-fetch');
const queries = require('../db/queries/users');
const EmailService = require('../email/EmailService');

// For development/test, put /api prefix.
// For production, we use a reverse proxy for all `/api` requests --> `/`
const router = new Router({ prefix: process.env.NODE_ENV === 'production' ? '' : `/api` });

router.post(`/users/login`, async (ctx, next) => {
  await passport.authenticate('local')(ctx, next);
  if (ctx.isAuthenticated()) {
    // for dev/testing purposes, don't care about email verification
    if (process.env.NODE_ENV === 'production' && !ctx.state.user.email_verified) {
      ctx.status = 401;
      ctx.body = {
        status: 'error',
        message: 'User email has not yet been verified.',
      };
    } else {
      const user = ctx.req.user;
      const { id, username } = user;
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: {
          id,
          username,
        },
      };
    }
  } else {
    ctx.status = 401;
    ctx.body = {
      status: 'error',
      message: 'Wrong username or password.',
    };
  }
});

router.get(`/users/logout`, async (ctx) => {
  if (ctx.isAuthenticated()) {
    ctx.logout();
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: 'User has logged out.',
    };
  }
});

router.post(`/users/create`, async (ctx) => {
  const payload = ctx.request.body;

  // Don't check recaptcha in tests unless we're specifically testing recaptcha behavior
  if (process.env.NODE_ENV !== 'test' || process.env.__TEST_RECAPTCHA__ === 'on') {
    const recaptchaResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CWK_RECAPTCHA_KEY}&response=${payload.token}`,
      {
        method: 'POST',
      },
    );

    const recaptchaResult = await recaptchaResponse.json();
    if (!recaptchaResult.success || !(recaptchaResult.score > 0.5)) {
      ctx.status = 400;
      ctx.body = {
        status: 'error',
        recaptcha: true,
        data: ['Recaptcha thinks you are a bot. Try again later or create a GitHub issue.'],
      };
      return;
    }
    delete payload.token;
  }

  // Either array of error messages, or an array with a single user
  const usersOrErrors = await queries.addUser(payload);
  if (typeof usersOrErrors[0] === 'string') {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      data: usersOrErrors,
    };
  } else {
    const user = usersOrErrors[0];
    ctx.status = 201;
    ctx.body = {
      status: 'success',
      data: user,
    };

    const token = (await promisify(crypto.randomBytes)(20)).toString('hex');
    const expiryDate = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 1 month

    // Create email
    try {
      await queries.editUser(user.id, {
        email_verification_token: token,
        email_verification_token_expires: expiryDate,
      });

      EmailService.sendVerifyEmail({
        to: user.email,
        username: user.username,
        link: `https://code-workshop-kit.com/api/users/${user.id}/verify/${token}`,
      });
    } catch (e) {
      ctx.body = {
        status: 'error',
        data: ['User created but something went wrong with sending the verification email.'],
      };
      throw e;
    }
  }
});

router.get(`/users/:id`, async (ctx) => {
  if (ctx.params.id === 'current') {
    if (ctx.isAuthenticated()) {
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: ctx.req.user,
      };
    } else {
      ctx.status = 200;
      ctx.body = {
        status: 'error',
        message: 'No user currently logged in.',
      };
    }
    return;
  }

  const [user] = await queries.getUser(parseInt(ctx.params.id, 10));
  if (user) {
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: user,
    };
  } else {
    ctx.status = 404;
    ctx.body = {
      status: 'error',
      message: 'No user exists with that id.',
    };
  }
});

// TODO: Allow to resend verification email (once a day?)
// router.post(`/users/verify`, async (ctx) => {
//   const payload = ctx.request.body;
//   const { email } = payload;
//   const [user] = await queries.getUser(email, 'email');

//   if (!user) {
//     ctx.status = 400;
//     ctx.body = {
//       status: 'error',
//       message: 'No user exists with that email.',
//     };
//     return;
//   }

//   if (user && user.email_verified) {
//     ctx.status = 400;
//     ctx.body = {
//       status: 'error',
//       message: 'User already verified.',
//     };
//     return;
//   }

//   const token = (await promisify(crypto.randomBytes)(20)).toString('hex');
//   const expiryDate = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 1 month

//   // Create email
//   try {
//     await queries.editUser(user.id, {
//       email_verification_token: token,
//       email_verification_token_expires: expiryDate,
//     });
//     // sendVerifyEmail(
//     //   user.email,
//     //   `https://code-workshop-kit.com/api/users/${user.id}/verify/${token}`,
//     // );
//   } catch (e) {
//     ctx.status = 400;
//     ctx.body = {
//       status: 'error',
//       message: 'User exist but something went wrong with sending the email.',
//     };
//     throw e;
//   }

//   ctx.status = 200;
//   ctx.body = {
//     status: 'success',
//     data: `Email was sent to ${user.email}`,
//   };
// });

router.get(`/users/:id/verify/:token`, async (ctx) => {
  const { id, token } = ctx.params;

  /** @type {import('../db/queries/users').User[]} */
  const [user] = await queries.getUser(id, 'id', true);
  // try catch because timingSafeEqual could error if input buffers are not same length
  try {
    if (
      user.email_verification_token_expires > Date.now() &&
      crypto.timingSafeEqual(Buffer.from(user.email_verification_token), Buffer.from(token))
    ) {
      await queries.editUser(user.id, { email_verified: true });
      // TODO: add user to mailgun verified maillist or whitelist
      ctx.redirect('/verified');
    } else {
      ctx.redirect('/not-verified');
    }
  } catch (e) {
    ctx.redirect('/not-verified');
  }
});

module.exports = router;
