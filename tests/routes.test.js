const test = require('ava')

var request = require('supertest')
var mocks = require('./fixtures')

var app = require('../index').makeApp()

mocks.initMocks()

test('Home page returns 200 and has correct content', async t => {
  const pageHeading = 'Data publishing and sharing'
  const res = await request(app)
    .get('/')
    .expect(200)
  t.is(res.statusCode, 200)
  t.true(res.text.includes('DataHub'))
  t.true(res.text.includes(pageHeading))
  t.true(res.text.includes('UA-80458846-4'))
})

test('Dashboard page renders when jwt in cookies setup', async t => {
  const res = await request(app)
    .get('/dashboard')
    .set('Cookie', ['jwt=123456'])
  t.is(res.statusCode, 200)
  t.true(res.text.includes('Your Dashboard'))
})

test('Login with GitHub redirects to correct path', async t => {
  const res = await request(app)
    .get('/login/github')
  t.is(res.header.location, 'https://github.com/login/')
})

test('Login with GOOGLE redirects to correct path', async t => {
  const res = await request(app)
    .get('/login/google')
  t.is(res.header.location, 'https://accounts.google.com/o/oauth2/auth')
})

test('When redirected to /success it gets user info and writes into cookies then redirects to /', async t => {
  const res = await request(app)
    .get('/success?jwt=1a2b3c')
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('/dashboard'))
  t.true(res.text.includes('Redirecting to /dashboard'))
})

test('When user logs out, it clears jwt from cookie and redirects to /', async t => {
  const res = await request(app)
    .get('/logout')
  t.is(res.header.location, '/?logout=true')
})

test('When user logs out, it renders home page with alert message', async t => {
  const res = await request(app)
    .get('/?logout=true')
  t.true(res.text.includes('You have been successfully logged out.'))
})

test('Showcase page returns 200 and has correct content', async t => {
  const res = await request(app)
    .get('/admin/demo-package')
    .expect(200)
  t.is(res.statusCode, 200)
  t.true(res.text.includes('DataHub'))
})

test('Showcase page has readme, title and publisher in content', async t => {
  const res = await request(app)
    .get('/admin/demo-package')
    .expect(200)
  t.is(res.statusCode, 200)
  t.true(res.text.includes('Read me'))
  t.true(res.text.includes('DEMO - CBOE Volatility Index'))
})

test('Showcase page 404s on non-existent dataset', async t => {
  const res = await request(app)
    .get('/bad-user/bad-package')
    .expect(404)
  t.is(res.statusCode, 404)
})

test('Publisher page returns 200 and has correct content', async t => {
  const res = await request(app)
    .get('/publisher')
    .expect(200)
  t.is(res.statusCode, 200)
  t.true(res.text.includes('<h2 class="owner">publisher</h2>'))
  t.true(res.text.includes('<h2>Data Packages <span class="badge">1</span></h2>'))
})

test('Search page returns 200 and has correct content', async t => {
  const res = await request(app)
    .get('/search?q=test')
    .expect(200)
  t.is(res.statusCode, 200)
  t.true(res.text.includes('Discover Data'))
  t.true(res.text.includes('<input id="search-page-search"'))
  t.true(res.text.includes('1 package(s) found for <b>"test"</b>'))
})

test('Pricing page returns 200 and has correct content', async t => {
  const res = await request(app)
    .get('/pricing')
    .expect(200)
  t.is(res.statusCode, 200)
  t.true(res.text.includes('Metering'))
  t.true(res.text.includes('PRIVACY'))
})

test('Downloading a resource by name or index works for csv and json', async t => {
  let res = await request(app)
    .get('/admin/demo-package/r/demo-resource.csv')
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('/latest/data/csv/data/demo-resource.csv'))
  res = await request(app)
    .get('/admin/demo-package/r/demo-resource.json')
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('/latest/data/json/data/demo-resource.json'))
  res = await request(app)
    .get('/admin/demo-package/r/0.csv')
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('/latest/data/csv/data/demo-resource.csv'))
  res = await request(app)
    .get('/admin/demo-package/r/0.json')
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('/latest/data/json/data/demo-resource.json'))
})
