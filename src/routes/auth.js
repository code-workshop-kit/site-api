const Router = require('koa-router');
const passport = require('koa-passport');
const bcrypt = require('bcrypt');
const queries = require('../db/queries/users');

const router = new Router();
// For development/test, put /api prefix.
// For production, we use a reverse proxy for all `/api` requests --> `/`
const routePrefix = process.env.NODE_ENV === 'production' ? '' : `/api`;

router.post(`${routePrefix}/login`, passport.authenticate('local'));

router.post(`${routePrefix}/new-user`, async (ctx) => {
  const payload = ctx.request.body;
  const [user] = await queries.addUser(payload);

  if (user) {
    ctx.status = 201;
    ctx.body = {
      status: 'success',
      data: user,
    };
  } else {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: 'Sorry, an error has occurred creating your account.',
    };
  }
});

router.get(`${routePrefix}/is-logged`, async (ctx) => {
  console.log('ay', ctx.isAuthenticated());
});

module.exports = router;
