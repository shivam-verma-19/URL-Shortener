const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const expect = chai.expect;
const { describe, it } = require('mocha');
const jwt = require('jsonwebtoken');
require('dotenv').config();
chai.use(chaiHttp);


const payload = { id: 'testUserId', email: 'test@example.com' };

describe('URL Shortening Endpoints', () => {
    it('should create a short URL', (done) => {
        const authToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        chai.request(app)
            .post('/api/shorten')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                longUrl: 'https://www.example.com/very/long/url',
                customAlias: 'example',
                topic: 'test'
            })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('shortUrl');
                expect(res.body).to.have.property('createdAt');
                done();
            });
    });

    it('should redirect to the original URL', (done) => {
        chai.request(app)
            .get('/api/shorten/example')
            .redirects(0)  // Do not follow redirects to test the status code
            .end((err, res) => {
                expect(res).to.have.status(302);
                expect(res).to.have.header('location');
                done();
            });
    });
});
