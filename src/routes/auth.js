const Router = require('koa-router');
const passport = require('koa-passport');

// For development/test, put /api prefix.
// For production, we use a reverse proxy for all `/api` requests --> `/`
const router = new Router({ prefix: process.env.NODE_ENV === 'production' ? '' : '/api' });

router.get('/auth/github', async (ctx, next) => {
  passport.authenticate('github', { scope: ['user:email', 'read:user'] })(ctx, next);
});

router.get('/auth/github/callback', async (ctx, next) => {
  // Add a prefix to redirect to localhost port 8000 during development
  const prefix = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '';
  await passport.authenticate('github', {
    scope: ['user:email', 'read:user'],
    failureRedirect: `${prefix}/login`,
    successRedirect: `${prefix}/dashboard`,
  })(ctx, next);
});

router.post('/auth/login', async (ctx, next) => {
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
      const { user } = ctx.req;
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

router.get('/auth/logout', async (ctx) => {
  if (ctx.isAuthenticated()) {
    ctx.logout();
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: 'User has logged out.',
    };
  }
});

module.exports = router;
