var assert = require('assert')
var request = require('supertest')
var mocks = require('./fixtures')

var app = require('../index').makeApp()

describe('Routes', function(){
  it('Home page returns 200 and has correct content', function(done){
    request(app)
      .get('/')
      .expect(200)
      .end(function(err, res) {
        assert.equal(res.statusCode, 200)
        assert(res.text.match('DataHub'), res.text)
        done()
    })
  })

  it('Showcase page returns 200 and has correct content', function(done){
    request(app)
      .get('/demo/demo-package')
      .expect(200)
      .end(function(err, res) {
        assert.equal(res.statusCode, 200)
        assert(res.text.match('DataHub'), res.text)
        done()
    })
  })

  it('Showcase page has readme, title and publisher in content', function(done){
    mocks.initMocks()
    request(app)
      .get('/demo/demo-package')
      .expect(200)
      .end(function(err, res) {
        assert.equal(res.statusCode, 200)
        assert(res.text.match('by admin'), res.text)
        assert(res.text.match('README'), res.text)
        assert(res.text.match('DEMO - CBOE Volatility Index'), res.text)
        done()
    })
  })
})
