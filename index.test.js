const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('index');
const { expect } = chai;

chai.use(chaiHttp);

describe('API Tests', () => {
    // Test for the "/borrow" endpoint
    describe('/POST borrow', () => {
        it('it should borrow a book', (done) => {
            chai.request(app)
                .post('/borrow')
                .send({ memberCode: 'M001', bookCode: 'JK-45' })
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.have.property('message').equal('Book borrowed successfully');
                    done();
                });
        });
    });

    // Test for the "/return" endpoint
    describe('/POST return', () => {
        it('it should return a book', (done) => {
            chai.request(app)
                .post('/return')
                .send({ memberCode: 'M001', bookCode: 'JK-45', daysLate: 5 })
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.have.property('message').equal('Book returned successfully');
                    done();
                });
        });
    });

    // Test for the "/books" endpoint
    describe('/GET books', () => {
        it('it should get all books', (done) => {
            chai.request(app)
                .get('/books')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('array');
                    // Add more assertions to check the structure of the response if needed
                    done();
                });
        });
    });

    // Test for the "/members" endpoint
    describe('/GET members', () => {
        it('it should get all members', (done) => {
            chai.request(app)
                .get('/members')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('array');
                    // Add more assertions to check the structure of the response if needed
                    done();
                });
        });
    });
});