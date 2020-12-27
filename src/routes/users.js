const Router = require('koa-router');
const passport = require('koa-passport');
const queries = require('../db/queries/users');

// For development/test, put /api prefix.
// For production, we use a reverse proxy for all `/api` requests --> `/`
const router = new Router({ prefix: process.env.NODE_ENV === 'production' ? '' : `/api` });

router.post(`/users/login`, async (ctx, next) => {
  await passport.authenticate('local')(ctx, next);
  if (ctx.isAuthenticated()) {
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: ctx.req.user,
    };
  } else {
    ctx.status = 401;
    ctx.body = {
      status: 'error',
      message: 'User login failed.',
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

  // Either array of error messages, or an array with a single user
  const usersOrErrors = await queries.addUser(payload);
  if (typeof usersOrErrors[0] === 'string') {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      data: usersOrErrors,
    };
  } else {
    ctx.status = 201;
    ctx.body = {
      status: 'success',
      data: usersOrErrors[0],
    };
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
      ctx.status = 401;
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

module.exports = router;
