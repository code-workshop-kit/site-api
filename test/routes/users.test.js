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

  describe('fetch user with id', () => {
    it('should return a user with an id', async () => {
      const result = await chai.request(server).get('/api/users/1');
      delete result.body.data.created_at;

      expect(result.status).to.equal(200);
      expect(result.type).to.equal('application/json');
      expect(result.body).to.eql({
        status: 'success',
        data: {
          id: 1,
          username: 'foofoo',
          email: 'foofoo@example.com',
        },
      });
    });

    it('should return an error if no user exists with given id', async () => {
      const result = await chai.request(server).get('/api/users/4');
      expect(result.status).to.equal(404);
      expect(result.type).to.equal('application/json');
      expect(result.body).to.eql({
        status: 'error',
        message: 'No user exists with that id.',
      });
    });
  });

  describe('create-user', () => {
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

    it('should return an error message when creating user with bad username', async () => {
      let postResult = await chai.request(server).post('/api/users/create').send({
        username: 'dog',
        password: 'elephants',
        email: 'dog@example.com',
      });
      expect(postResult.status).to.equal(400);
      expect(postResult.type).to.equal('application/json');
      expect(postResult.body).to.eql({
        status: 'error',
        data: ['Username is too short. Please enter a username with 4 or more characters.'],
      });

      postResult = await chai.request(server).post('/api/users/create').send({
        username: 'dooooooooooooooooooooooogggggggggggggggggggggggggggggg',
        password: 'elephants',
        email: 'dog@example.com',
      });
      expect(postResult.status).to.equal(400);
      expect(postResult.type).to.equal('application/json');
      expect(postResult.body).to.eql({
        status: 'error',
        data: ['Username is too long. Please enter a username with 32 or less characters.'],
      });

      postResult = await chai.request(server).post('/api/users/create').send({
        username: 'foofoo',
        password: 'elephants',
        email: 'dog@example.com',
      });
      expect(postResult.status).to.equal(400);
      expect(postResult.type).to.equal('application/json');
      expect(postResult.body).to.eql({
        status: 'error',
        data: ['Username already exists.'],
      });
    });

    it('should return an error message when creating user with bad password', async () => {
      let postResult = await chai.request(server).post('/api/users/create').send({
        username: 'doggo',
        password: 'elephan',
        email: 'doggo@example.com',
      });
      expect(postResult.status).to.equal(400);
      expect(postResult.type).to.equal('application/json');
      expect(postResult.body).to.eql({
        status: 'error',
        data: ['Password is too short. Please enter a password with 8 or more characters.'],
      });

      postResult = await chai.request(server).post('/api/users/create').send({
        username: 'doggo',
        password:
          '3JMSUbdfHFkppCU#VDQE6o1lrK%8j$AHt2exM4GX8jP1DJ^*Uy2dHjO42AX#VmaEHpVmRlSRS&FapVofS6sAkJx9Q6hcu&^z6*9GX8jP1DJ^*Uy2dHjO42AX#VmaEHpVmRlSRS&FapVofS6sAkJx',
        email: 'dog@example.com',
      });
      expect(postResult.status).to.equal(400);
      expect(postResult.type).to.equal('application/json');
      expect(postResult.body).to.eql({
        status: 'error',
        data: ['Password is too long. Please enter a password with 128 or less characters.'],
      });
    });

    it('should return an error message when creating user with bad email', async () => {
      let postResult = await chai.request(server).post('/api/users/create').send({
        username: 'doggo',
        password: 'elephants',
        email: 'doggo@example',
      });
      expect(postResult.status).to.equal(400);
      expect(postResult.type).to.equal('application/json');
      expect(postResult.body).to.eql({
        status: 'error',
        data: ['Email address is not a valid email address.'],
      });

      postResult = await chai.request(server).post('/api/users/create').send({
        username: 'doggo',
        password: 'elephants',
        email: 'foofoo@example.com',
      });
      expect(postResult.status).to.equal(400);
      expect(postResult.type).to.equal('application/json');
      expect(postResult.body).to.eql({
        status: 'error',
        data: ['Email address is already registered.'],
      });
    });

    it('should return a generic error when creating user with bad data', async () => {
      let postResult = await chai.request(server).post('/api/users/create').send({
        username: 12345,
        password: 'elephants',
        email: 'doggo@example.com',
      });
      expect(postResult.status).to.equal(400);
      expect(postResult.type).to.equal('application/json');
      expect(postResult.body).to.eql({
        status: 'error',
        data: [
          'Sorry, an error has occurred creating your account. Did you fill everything in correctly?',
        ],
      });

      postResult = await chai.request(server).post('/api/users/create').send({
        username: 'doggo',
        password: 12345,
        email: 'doggo@example.com',
      });
      expect(postResult.status).to.equal(400);
      expect(postResult.type).to.equal('application/json');
      expect(postResult.body).to.eql({
        status: 'error',
        data: [
          'Sorry, an error has occurred creating your account. Did you fill everything in correctly?',
        ],
      });

      postResult = await chai.request(server).post('/api/users/create').send({
        username: 'doggo',
        email: 'doggo@example.com',
      });
      expect(postResult.status).to.equal(400);
      expect(postResult.type).to.equal('application/json');
      expect(postResult.body).to.eql({
        status: 'error',
        data: [
          'Sorry, an error has occurred creating your account. Did you fill everything in correctly?',
        ],
      });
    });
  });

  describe('login', () => {
    it('should allow logging in which persists through session', async () => {
      const agent = chai.request.agent(server);
      const loginResult = await agent.post('/api/users/login').send({
        username: 'foofoo',
        password: 'pineapples',
      });
      delete loginResult.body.data.created_at;

      expect(loginResult.status).to.equal(200);
      expect(loginResult).to.have.cookie('cwk.session');
      expect(loginResult.type).to.equal('application/json');
      expect(loginResult.body).to.eql({
        status: 'success',
        data: {
          id: 1,
          username: 'foofoo',
          email: 'foofoo@example.com',
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
          username: 'foofoo',
          email: 'foofoo@example.com',
        },
      });
      agent.close();
    });

    it('should return an error on /api/users/current when there is no user logged in', async () => {
      const result = await chai.request(server).get('/api/users/current');

      expect(result.status).to.equal(200);
      expect(result.type).to.equal('application/json');
      expect(result.body).to.eql({
        status: 'error',
        message: 'No user currently logged in.',
      });
    });

    it('should return an error on /api/users/login when the given credentials are wrong', async () => {
      let result = await chai
        .request(server)
        .post('/api/users/login')
        .send({ username: 'foofoo', password: 'pineapple' });

      expect(result.status).to.equal(401);
      expect(result.type).to.equal('application/json');
      expect(result.body).to.eql({
        status: 'error',
        message: 'User login failed.',
      });

      result = await chai
        .request(server)
        .post('/api/users/login')
        .send({ username: 'foofoofoo', password: 'pineapples' });

      expect(result.status).to.equal(401);
      expect(result.type).to.equal('application/json');
      expect(result.body).to.eql({
        status: 'error',
        message: 'User login failed.',
      });
    });

    it('should allow logging out', async () => {
      const agent = chai.request.agent(server);
      const loginResult = await agent.post('/api/users/login').send({
        username: 'foofoo',
        password: 'pineapples',
      });
      delete loginResult.body.data.created_at;

      expect(loginResult.status).to.equal(200);
      expect(loginResult).to.have.cookie('cwk.session');
      expect(loginResult.type).to.equal('application/json');
      expect(loginResult.body).to.eql({
        status: 'success',
        data: {
          id: 1,
          username: 'foofoo',
          email: 'foofoo@example.com',
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
          username: 'foofoo',
          email: 'foofoo@example.com',
        },
      });

      const logoutResult = await agent.get('/api/users/logout');
      expect(logoutResult.status).to.equal(200);
      expect(logoutResult.type).to.equal('application/json');
      expect(logoutResult.body).to.eql({
        status: 'success',
        data: 'User has logged out.',
      });

      // Verify user is logged out now
      const fetchResultTwo = await agent.get('/api/users/current');
      expect(fetchResultTwo.status).to.equal(200);
      expect(fetchResultTwo.type).to.equal('application/json');
      expect(fetchResultTwo.body).to.eql({
        status: 'error',
        message: 'No user currently logged in.',
      });

      agent.close();
    });
  });
});
