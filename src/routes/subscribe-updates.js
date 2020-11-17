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

module.exports = router;
