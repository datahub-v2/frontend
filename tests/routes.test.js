var assert = require('assert')
var request = require('supertest')

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
})
