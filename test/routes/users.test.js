process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../src/index.js');
const knex = require('../../src/db/connection');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Users & Auth API', () => {
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

  it('should return a user with an id', async () => {
    const result = await chai.request(server).get('/api/users/1');
    delete result.body.data.created_at;

    expect(result.status).to.equal(200);
    expect(result.type).to.equal('application/json');
    expect(result.body).to.eql({
      status: 'success',
      data: {
        id: 1,
        username: 'foo',
        email: 'foo@example.com',
      },
    });
  });

  it('should allow creating a user and return the user', async () => {
    const postResult = await chai.request(server).post('/api/users/create').send({
      username: 'doggo',
      password: 'elephants',
      email: 'qux@example.com',
    });
    delete postResult.body.data.created_at;

    expect(postResult.status).to.equal(201);
    expect(postResult.type).to.equal('application/json');
    expect(postResult.body).to.eql({
      status: 'success',
      data: {
        id: 3,
        username: 'doggo',
        email: 'qux@example.com',
      },
    });

    // Verify it has persisted
    const fetchResult = await chai.request(server).get('/api/users/3');
    delete fetchResult.body.data.created_at;

    expect(fetchResult.status).to.equal(200);
    expect(fetchResult.type).to.equal('application/json');
    expect(fetchResult.body).to.eql({
      status: 'success',
      data: {
        id: 3,
        username: 'doggo',
        email: 'qux@example.com',
      },
    });
  });

  it('should allow logging in which persists through session', async () => {
    const agent = chai.request.agent(server);
    const loginResult = await agent.post('/api/users/login').send({
      username: 'foo',
      password: 'pineapples',
    });
    delete loginResult.body.data.created_at;

    expect(loginResult.status).to.equal(200);
    expect(loginResult).to.have.cookie('koa.sess');
    expect(loginResult.type).to.equal('application/json');
    expect(loginResult.body).to.eql({
      status: 'success',
      data: {
        id: 1,
        username: 'foo',
        email: 'foo@example.com',
      },
    });

    // Verify if session cookie works after logging in, should return the logged in user now
    const fetchResult = await agent.get('/api/users/current');
    delete fetchResult.body.data.created_at;

    expect(fetchResult.status).to.equal(200);
    expect(fetchResult.type).to.equal('application/json');
    expect(fetchResult.body).to.eql({
      status: 'success',
      data: {
        id: 1,
        username: 'foo',
        email: 'foo@example.com',
      },
    });
    agent.close();
  });
});
