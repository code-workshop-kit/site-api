process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
const server = require('../src/index.js');
const knex = require('../src/db/connection');

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

  it('should succeed on adding a new email address', (done) => {
    chai
      .request(server)
      .post('/api/subscribe-updates')
      .send({ email: 'foo@bar.com' })
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.equal(201);
        res.type.should.equal('application/json');
        res.body.status.should.eql('success');
        done();
      });
  });

  it('should fail on adding an invalid email address', (done) => {
    chai
      .request(server)
      .post('/api/subscribe-updates')
      .send({ email: 'foobar' })
      .end((err, res) => {
        res.status.should.equal(400);
        res.type.should.equal('application/json');
        res.body.status.should.eql('error');
        res.body.message.should.eql('Given email is not a valid email address');
        done();
      });
  });
});
