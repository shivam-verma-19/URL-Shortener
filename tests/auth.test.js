const chai = require('chai');
const { describe, it } = require('mocha');
const chaiHttp = require('chai-http');
const app = require('../app');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Authentication Endpoints', () => {
    it('should log in a user via Google Sign-In', (done) => {
        chai.request(app)
            .post('/api/auth/google')
            .send({ token: 'sample-google-token' })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('user');
                expect(res.body).to.have.property('token');
                done();
            });
    });
});
