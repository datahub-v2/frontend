var assert = require('assert')
var request = require('supertest')
var mocks = require('./fixtures')

var app = require('../index').makeApp()

mocks.initMocks()

describe('Routes', function(){
  it('Home page returns 200 and has correct content', function(done){
    const pageHeading = 'Data publishing and sharing'
    request(app)
      .get('/')
      .expect(200)
      .end(function(err, res) {
        assert.equal(res.statusCode, 200)
        assert(res.text.match('DataHub'), res.text)
        assert(res.text.match(pageHeading), res.text)
        done()
    })
  })

  it('Dashboard page renders instead of Home when jwt in cookies setup', function(done){
    request(app)
      .get('/')
      .set('Cookie', ['jwt=123456'])
      .end(function(err, res) {
        assert.equal(res.statusCode, 200)
        assert(res.text.match('Your Dashboard'), res.text)
        done()
      })
  })

  it('Login with GitHub redirects to correct path', function(done){
    request(app)
      .get('/login/github')
      .end(function(err, res) {
        assert.equal(res.header.location, 'https://github.com/login/')
        done()
      })
  })

  it('Login with GOOGLE redirects to correct path', function(done){
    request(app)
      .get('/login/google')
      .end(function(err, res) {
        assert.equal(res.header.location, 'https://accounts.google.com/o/oauth2/auth')
        done()
      })
  })

  it('When redirected to /success it gets user info and writes into cookies then redirects to /', function(done){
    request(app)
      .get('/success?jwt=1a2b3c')
      .expect('set-cookie', 'jwt=1a2b3c; Path=/,email=test_username_but_not_email; Path=/,name=Firstname%20Secondname; Path=/', done)
  })

  it('When user logs out, it clears jwt from cookie and redirects to /', function(done){
    request(app)
      .get('/logout')
      .end(function(err, res) {
        assert.equal(res.header.location, '/?logout=true')
        done()
      })
  })

  it('When user logs out, it renders home page with alert message', function(done){
    request(app)
      .get('/?logout=true')
      .end(function(err, res) {
        assert(res.text.match('You have been successfully logged out.'), res.text)
        done()
      })
  })

  it('Showcase page returns 200 and has correct content', function(done){
    request(app)
      .get('/admin/demo-package')
      .expect(200)
      .end(function(err, res) {
        assert.equal(res.statusCode, 200)
        assert(res.text.match('DataHub'), res.text)
        done()
    })
  })

  it('Showcase page has readme, title and publisher in content', function(done){
    request(app)
      .get('/admin/demo-package')
      .expect(200)
      .end(function(err, res) {
        assert.equal(res.statusCode, 200)
        assert(res.text.match('Read me'), res.text)
        assert(res.text.match('DEMO - CBOE Volatility Index'), res.text)
        done()
    })
  })

  it('Showcase page 404s on non-existent dataset', function(done){
    request(app)
      .get('/bad-user/bad-package')
      .expect(404)
      .end(function(err, res) {
        done()
    })
  })

  it('Publisher page returns 200 and has correct content', function(done){
    request(app)
      .get('/publisher')
      .expect(200)
      .end(function(err, res) {
        assert.equal(res.statusCode, 200)
        assert(res.text.match('Data Packages'), res.text)
        assert(res.text.match('Member since'), res.text)
        done()
    })
  })

  it('Search page returns 200 and has correct content', function(done){
    request(app)
      .get('/search')
      .expect(200)
      .end(function(err, res) {
        assert.equal(res.statusCode, 200)
        assert(res.text.match('Discover Data'), res.text)
        assert(res.text.match('packages found for'), res.text)
        done()
    })
  })

  it('Pricing page returns 200 and has correct content', function(done){
    request(app)
      .get('/pricing')
      .expect(200)
      .end(function(err, res) {
        assert.equal(res.statusCode, 200)
        assert(res.text.match('Metering'), res.text)
        assert(res.text.match('PRIVACY'), res.text)
        done()
      })
  })
})
