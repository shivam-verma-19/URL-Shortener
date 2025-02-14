const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const expect = chai.expect;
const { describe, it } = require('mocha');
const jwt = require('jsonwebtoken');
require('dotenv').config();
require('dotenv').config();

chai.use(chaiHttp);

const payload = { id: 'testUserId', email: 'test@example.com' };

describe('Analytics Endpoints', () => {
    it('should retrieve URL analytics', (done) => {
        const authToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        chai.request(app)
            .get('/api/analytics/example')
            .set('Authorization', `Bearer ${authToken}`)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('totalClicks');
                expect(res.body).to.have.property('uniqueUsers');
                expect(res.body).to.have.property('clicksByDate');
                done();
            });
    });

    it('should retrieve overall analytics for the user', (done) => {
        const authToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        chai.request(app)
            .get('/api/analytics/overall')
            .set('Authorization', `Bearer ${authToken}`)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('totalUrls');
                expect(res.body).to.have.property('totalClicks');
                done();
            });
    });
});
