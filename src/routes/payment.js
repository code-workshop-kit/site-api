require('dotenv').config();
const Router = require('koa-router');
const stripe = require('stripe')(process.env.CWK_STRIPE_TEST_KEY);

const endpointSecret = process.env.CWK_STRIPE_ENDPOINT_SECRET;

// For development/test, put /api prefix.
// For production, we use a reverse proxy for all `/api` requests --> `/`
const router = new Router({ prefix: process.env.NODE_ENV === 'production' ? '' : `/api` });

const computeTotal = (items) => {
  return items
    .filter((item) => item.id === 'license-basic')
    .reduce((acc, curr) => (acc += curr.amount * 2599), 0);
};

router.post('/payments/license', async (ctx, next) => {
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
  });

  // TODO: Add payment to DB

  ctx.status = 200;
  ctx.body = {
    status: 'success',
    publishableKey: process.env.CWK_STRIPE_PUBLISHABLE_TEST_KEY,
    clientSecret: paymentIntent.client_secret,
  };
});

router.post('/payments/webhook', async (ctx, next) => {
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
    console.log(`⚠️ Webhook signature verification failed.`, err.message);
    ctx.body = {
      status: 'success',
      message: 'Thanks, but not sure if you are actually Stripe :(',
    };
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;

      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);

      // TODO:
      // 1) Fetch from DB the payment intent with the id
      // 2) Set succeeded to true for payment
      // 3) Get the product (license type), but add this to Stripe first using Product API
      // 4) Change license type for the user
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;

      console.log(`PaymentIntent for ${paymentIntent.amount} was unsuccessful...`);
      console.log(`${paymentIntent.last_payment_error.message}`);

      // TODO:
      // 1) Fetch from DB the payment intent with the id
      // 2) Set error to the error message from Stripe
      break;
    }
    default:
    // Unexpected event type
  }
});

module.exports = router;
