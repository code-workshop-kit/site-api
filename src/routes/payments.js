require('dotenv').config();
const Router = require('koa-router');
const queries = require('../db/queries/payments');
const userQueries = require('../db/queries/users');

const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

/* eslint-disable import/order */
const stripe =
  process.env.NODE_ENV === 'production'
    ? require('stripe')(process.env.STRIPE_LIVE_KEY)
    : require('stripe')(process.env.STRIPE_TEST_KEY);
/* eslint-enable import/order */

// For development/test, put /api prefix.
// For production, we use a reverse proxy for all `/api` requests --> `/`
const router = new Router({ prefix: process.env.NODE_ENV === 'production' ? '' : '/api' });

// TODO: be able to compute for other license types with different prices. Don't trust frontend, set prices here.
const computeTotal = (items) =>
  items
    .filter((item) => item.id === 'license_premium')
    .reduce((acc, curr) => acc + curr.amount * 2599, 0);

router.post('/payments/license', async (ctx) => {
  if (!ctx.state.user) {
    ctx.status = 401;
    ctx.body = {
      status: 'error',
      message: 'Unauthorized, user is not logged in.',
    };
    return;
  }

  const payload = ctx.request.body;
  const total = computeTotal(payload.items);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: 'eur',
    receipt_email: ctx.state.user.email,
    metadata: {
      items: JSON.stringify(payload.items),
    },
  });

  const { id, amount, client_secret: clientSecret, created, currency } = paymentIntent;
  await queries.addPayment({
    user_id: ctx.state.user.id,
    stripe_id: id,
    stripe_secret: clientSecret,
    currency,
    amount,
    product_data: JSON.stringify(payload.items),
    created_at: new Date(created * 1000).toISOString(),
  });

  ctx.status = 200;
  ctx.body = {
    status: 'success',
    publishableKey:
      process.env.NODE_ENV === 'production'
        ? process.env.STRIPE_PUBLISHABLE_LIVE_KEY
        : process.env.STRIPE_PUBLISHABLE_TEST_KEY,
    clientSecret,
  };
});

router.post('/payments/webhook', async (ctx) => {
  ctx.status = 200;
  let event = ctx.request.body;
  const signature = ctx.header['stripe-signature'];

  try {
    event = stripe.webhooks.constructEvent(ctx.request.rawBody, signature, endpointSecret);
    ctx.body = {
      status: 'success',
      message: 'Thanks Stripe <3',
    };
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    ctx.body = {
      status: 'success',
      message: 'Thanks, but not sure if you are actually Stripe :(',
    };
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      try {
        const [payment] = await queries.getPayment(paymentIntent.id, 'stripe_id');
        // Verify that the amount we received and currency are indeed correct
        if (
          payment.amount === paymentIntent.amount &&
          payment.currency === paymentIntent.currency
        ) {
          await queries.editPayment(payment.id, {
            succeeded: true,
          });

          const items = JSON.parse(paymentIntent.metadata.items);
          const [user] = await userQueries.getUser(payment.user_id, 'id');

          if (user && items) {
            const edits = [];
            for (const item of items) {
              if (item.id.startsWith('license')) {
                const availableLicenses = ['free', 'premium', 'investor', 'sponsor'];
                const licenseType = item.id.split('_')[1];

                if (
                  availableLicenses.indexOf(user.license_type) <
                  availableLicenses.indexOf(licenseType)
                ) {
                  // User bought an upgrade to current license type, so change it
                  edits.push(userQueries.editUser(user.id, { license_type: licenseType }));
                }
              }
            }
            await Promise.all(edits);
          }
        }
      } catch (e) {
        ctx.body = {
          status: 'error',
          message: "We don't know anything about this payment.",
        };
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;

      console.error(`PaymentIntent for ${paymentIntent.amount} was unsuccessful...`);
      console.error(`${paymentIntent.last_payment_error.message}`);
      try {
        await queries.editPayment(paymentIntent.id, {
          succeeded: false,
          error: paymentIntent.last_payment_error.message,
        });
      } catch (e) {
        ctx.body = {
          status: 'error',
          message: "We don't know anything about this payment.",
        };
      }
      break;
    }
    // no default
  }
});

module.exports = router;
