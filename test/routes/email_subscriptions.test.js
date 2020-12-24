process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../src/index.js');
const knex = require('../../src/db/connection');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Email addresses API', () => {
  beforeEach(() => {
    return knex.migrate
      .rollback()
      .then(() => {
        return knex.migrate.latest();
      })
      .then(() => {
        return knex.seed.run();
      });
  });

  afterEach(() => {
    return knex.migrate.rollback();
  });

  it('should succeed on adding a new email address', async () => {
    const result = await chai
      .request(server)
      .post('/api/subscribe-updates')
      .send({ email: 'foo@bar.com' });

    expect(result.status).to.equal(201);
    expect(result.type).to.equal('application/json');
    expect(result.body.status).to.eql('success');
  });

  it('should fail on adding an invalid email address', async () => {
    const result = await chai
      .request(server)
      .post('/api/subscribe-updates')
      .send({ email: 'foobar' });

    expect(result.status).to.equal(400);
    expect(result.type).to.equal('application/json');
    expect(result.body.status).to.eql('error');
    expect(result.body.message).to.eql('Given email is not a valid email address');
  });
});
