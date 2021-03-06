const Router = require('koa-router');
const queries = require('../db/queries/email_subscriptions');
const { addToMailingList } = require('../email/EmailService');

// For development/test, put /api prefix.
// For production, we use a reverse proxy for all `/api` requests --> `/`
const router = new Router({ prefix: process.env.NODE_ENV === 'production' ? '' : '/api' });

router.post('/subscribe-updates', async (ctx) => {
  try {
    const result = await queries.addEmailAddress(ctx.request.body.email);
    if (result.length) {
      const { email } = result[0];
      ctx.status = 201;
      ctx.body = {
        status: 'success',
        data: email,
      };

      if (process.env.NODE_ENV === 'production') {
        await addToMailingList({ address: email }, 'announcements@mail.code-workshop-kit.com');
      }
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

// TODO: Allow this route for admins so we can easily check these emails?
// router.get(`/email_subscriptions`, async (ctx) => {
//   const emails = await queries.getAllEmailAddresses();
//   ctx.status = 200;
//   ctx.body = {
//     status: 'success',
//     data: emails,
//   };
// });

module.exports = router;
