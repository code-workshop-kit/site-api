process.env.NODE_ENV = 'test';

const { promisify } = require('util');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const server = require('../../src/index.js');
const knex = require('../../src/db/connection');
const queries = require('../../src/db/queries/users');
const expect = chai.expect;
const EmailService = require('../../src/email/EmailService');

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
          email_verified: false,
          license_type: 'free',
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
          email_verified: false,
          license_type: 'free',
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
          email_verified: false,
          license_type: 'free',
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

    it('should fail on bad recaptcha', async () => {
      process.env.__TEST_RECAPTCHA__ = 'on';
      const postResult = await chai.request(server).post('/api/users/create').send({
        username: 'doggo',
        password: 'elephants',
        email: 'qux@example.com',
        token: 'foo',
      });
      process.env.__TEST_RECAPTCHA__ = 'off';

      expect(postResult.status).to.equal(400);
      expect(postResult.body).to.eql({
        status: 'error',
        recaptcha: true,
        data: ['Recaptcha thinks you are a bot. Try again later or create a GitHub issue.'],
      });
    });
  });

  describe('login', () => {
    it('should allow logging in which persists through session', async () => {
      const agent = chai.request.agent(server);
      const loginResult = await agent.post('/api/auth/login').send({
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
          email_verified: false,
          license_type: 'free',
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

    it('should return an error on /api/auth/login when the given credentials are wrong', async () => {
      let result = await chai
        .request(server)
        .post('/api/auth/login')
        .send({ username: 'foofoo', password: 'pineapple' });

      expect(result.status).to.equal(401);
      expect(result.type).to.equal('application/json');
      expect(result.body).to.eql({
        status: 'error',
        message: 'Wrong username or password.',
      });

      result = await chai
        .request(server)
        .post('/api/auth/login')
        .send({ username: 'foofoofoo', password: 'pineapples' });

      expect(result.status).to.equal(401);
      expect(result.type).to.equal('application/json');
      expect(result.body).to.eql({
        status: 'error',
        message: 'Wrong username or password.',
      });
    });

    it('should allow logging out', async () => {
      const agent = chai.request.agent(server);
      const loginResult = await agent.post('/api/auth/login').send({
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
          email_verified: false,
          license_type: 'free',
        },
      });

      const logoutResult = await agent.get('/api/auth/logout');
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

  describe('verify', () => {
    it('should send a verification email upon successful account creation', async () => {
      const stub = sinon.stub(EmailService, 'sendVerifyEmail');
      await chai.request(server).post('/api/users/create').send({
        username: 'doggo',
        password: 'elephants',
        email: 'qux@example.com',
      });
      stub.restore();
      expect(stub.callCount).to.equal(1);
    });

    it('should allow verifying the email through the link sent, fails on invalid or expired token', async () => {
      let token = (await promisify(crypto.randomBytes)(20)).toString('hex');
      let expiryDate = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 1 month
      await queries.editUser(2, {
        email_verification_token: token,
        email_verification_token_expires: expiryDate,
      });
      let result = await chai.request(server).get(`/api/users/2/verify/${token}`);
      expect(result.request.url.endsWith('/verified')).to.be.true;
      result = await chai.request(server).get(`/api/users/2/verify/foo`);
      expect(result.request.url.endsWith('/not-verified')).to.be.true;

      token = (await promisify(crypto.randomBytes)(20)).toString('hex');
      expiryDate = new Date(Date.now() - 30 * 24 * 3600 * 1000); // 1 month ago
      await queries.editUser(2, {
        email_verification_token: token,
        email_verification_token_expires: expiryDate,
      });
      result = await chai.request(server).get(`/api/users/2/verify/${token}`);
      expect(result.request.url.endsWith('/not-verified')).to.be.true;
    });
  });

  describe('forgot-password', () => {
    let emailStub;
    beforeEach(() => {
      emailStub = sinon.stub(EmailService, 'sendResetPasswordEmail');
    });

    afterEach(() => {
      emailStub.restore();
    });

    it('should send a forgot password email upon receiving a request with a valid email address', async () => {
      await chai.request(server).post('/api/users/forgot-password').send({
        email: 'foofoo@example.com',
      });
      expect(emailStub.callCount).to.equal(1);

      await chai.request(server).post('/api/users/forgot-password').send({
        email: 'foobar@example.com',
      });
      expect(emailStub.callCount).to.equal(1);
    });

    it('should create and validate with a password token, and reset the password', async () => {
      await chai.request(server).post('/api/users/forgot-password').send({
        email: 'foofoo@example.com',
      });

      let [result] = await queries.getUser(1, 'id', true);
      const token = result.password_reset_token;
      const previousPw = result.password;

      // wrong token does not change password
      await chai.request(server).post('/api/users/reset-password').send({
        token: 'foo',
        password: 'something',
      });

      [result] = await queries.getUser(1, 'id', true);
      let { password } = result;
      expect(password).to.equal(previousPw);

      // correct token changes password
      await chai.request(server).post('/api/users/reset-password').send({
        token,
        password: 'something',
      });

      [result] = await queries.getUser(1, 'id', true);
      password = result.password;
      expect(password).to.not.equal(previousPw);
      const same = bcrypt.compareSync('something', password);
      expect(same).to.be.true;
    });

    it('should create and validate with a password token expiry date of 1 day', async () => {
      await chai.request(server).post('/api/users/forgot-password').send({
        email: 'foofoo@example.com',
      });

      // Change expiry date to now
      await queries.editUser(1, { password_reset_token_expires: new Date(Date.now()) });

      let [result] = await queries.getUser(1, 'id', true);
      const token = result.password_reset_token;
      const previousPw = result.password;

      // expired token does not change password
      await chai.request(server).post('/api/users/reset-password').send({
        token,
        password: 'something',
      });

      [result] = await queries.getUser(1, 'id', true);
      let { password } = result;
      expect(password).to.equal(previousPw);
    });
  });
});
