const Router = require('koa-router');
const queries = require('../db/queries/email_addresses.js');

const router = new Router();
// For development/test, put /api prefix.
// For production, we use a reverse proxy for all `/api` requests --> `/`
const routePrefix = process.env.NODE_ENV === 'production' ? '' : `/api`;

router.post(`${routePrefix}/subscribe-updates`, async (ctx) => {
  try {
    const email = await queries.addEmailAddress(ctx.request.body.email);
    if (email.length) {
      ctx.status = 201;
      ctx.body = {
        status: 'success',
        data: email,
      };
    } else {
      ctx.status = 400;
      ctx.body = {
        status: 'error',
        message: 'Something went wrong.',
      };
    }
  } catch (err) {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.',
    };
  }
});

router.get(`${routePrefix}/foo`, async (ctx) => {
  ctx.status = 200;
  ctx.body = {
    status: 'success',
    data: 'Hello, World!',
  };
});

router.get(`${routePrefix}/email_addresses`, async (ctx) => {
  const emails = await queries.getAllEmailAddresses();
  ctx.status = 200;
  ctx.body = {
    status: 'success',
    data: emails,
  };
});

module.exports = router;
