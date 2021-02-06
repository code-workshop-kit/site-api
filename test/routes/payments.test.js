process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../src/index');
const knex = require('../../src/db/connection');
const queries = require('../../src/db/queries/payments');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Payments with Stripe', () => {
  let agent;

  beforeEach(() => {
    return knex.migrate
      .rollback()
      .then(() => {
        return knex.migrate.latest();
      })
      .then(() => {
        return knex.seed.run();
      })
      .then(() => {
        // Use an authenticated agent so we can do payments on behalf of a user
        agent = chai.request.agent(server);
        return agent.post('/api/auth/login').send({
          username: 'foofoo',
          password: 'pineapples',
        });
      });
  });

  afterEach(() => {
    agent.close();
    return knex.migrate.rollback();
  });

  describe('/api/payments/license', () => {
    it('requires user to be authenticated for making payment intents', async () => {
      const result = await chai
        .request(server)
        .post('/api/payments/license')
        .send({ items: [{ id: 'license_premium', amount: 1 }] });

      expect(result.status).to.equal(401);
      expect(result.type).to.equal('application/json');
      expect(result.body.status).to.equal('error');
      expect(result.body.message).to.equal('Unauthorized, user is not logged in.');
    });

    it('should allow creating a payment intent and return the client secret and publishable key', async () => {
      const result = await agent
        .post('/api/payments/license')
        .send({ items: [{ id: 'license_premium', amount: 1 }] });

      expect(result.status).to.equal(200);
      expect(result.type).to.equal('application/json');
      expect(result.body.status).to.equal('success');
      expect(result.body.publishableKey.startsWith('pk_test_')).to.be.true;
      expect(result.body.clientSecret.startsWith('pi_')).to.be.true;

      const [payment] = await queries.getPayment(result.body.clientSecret, 'stripe_secret');
      expect(payment).to.exist;
    });

    it('sets the price based on the items requested', async () => {
      const result = await agent
        .post('/api/payments/license')
        .send({ items: [{ id: 'license_premium', amount: 5 }] });

      const [payment] = await queries.getPayment(result.body.clientSecret, 'stripe_secret');
      expect(payment.amount).to.equal(12995);
    });

    it('uses currency eur by default', async () => {
      const result = await agent
        .post('/api/payments/license')
        .send({ items: [{ id: 'license_premium', amount: 1 }] });

      const [payment] = await queries.getPayment(result.body.clientSecret, 'stripe_secret');
      expect(payment.currency).to.equal('eur');
    });

    it('stores the product data for the payment intent', async () => {
      const result = await agent
        .post('/api/payments/license')
        .send({ items: [{ id: 'license_premium', amount: 1 }] });

      const [payment] = await queries.getPayment(result.body.clientSecret, 'stripe_secret');
      expect(JSON.parse(payment.product_data)).to.eql([{ id: 'license_premium', amount: 1 }]);
    });
  });

  // Webhook events come from Stripe CLI / Stripe server with a signature that we verify.
  // We only respond to events that originate from Stripe, and that we also have records of
  // in our own database. Therefore, doing automated testing is pretty difficult without being
  // able to easily mock Stripe webhook events with the correct id's that correspond to payments
  // in our own database. So for now, we skip testing this...
  // Later on, we could potentially do end-to-end tests by spawning an instance of the entire
  // backend app + frontend app using docker and then use something like playwright/puppeteer
  describe('/api/payments/webhook', () => {
    it('logs an error when receiving a webhook event that does not originate from Stripe', async () => {
      const result = await chai
        .request(server)
        .post('/api/payments/webhook')
        .send({
          id: 'foo',
          type: 'payment_intent.succeeded',
          data: {
            object: {
              amount: 2000,
              currency: 'eur',
            },
          },
        });

      expect(result.body.message).to.be.equal('Thanks, but not sure if you are actually Stripe :(');
    });
  });
}).timeout(5000);
