const test = require('ava')

var request = require('supertest')
var mocks = require('./fixtures')

var app = require('../index').makeApp()

mocks.initMocks()

test('Home page returns 200 and has correct content', async t => {
  const res = await request(app)
    .get('/')
    .expect(200)
  t.is(res.statusCode, 200)
  t.true(res.text.includes('DataHub'))
})

test('Dashboard page renders when jwt in cookies setup', async t => {
  const res = await request(app)
    .get('/dashboard')
    .set('Cookie', ['jwt=1a2b3c;id=publisher;username=publisher;'])
  t.is(res.statusCode, 200)
  t.true(res.text.includes('Your Dashboard'))
  t.true(res.text.includes('1MB'))
  t.true(res.text.includes('<!-- Events -->'))
})

test('Login page works', async t => {
  const res = await request(app)
    .get('/login')
  t.true(res.text.includes('<a href="https://github.com/login/"'))
})

test('When redirected to /success it gets user info and writes into cookies then redirects to /', async t => {
  const res = await request(app)
    .get('/success?jwt=1a2b3c')
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('/dashboard'))
  t.true(res.text.includes('Redirecting to /dashboard'))
})

test('Logged in if credentials are passed with params', async t => {
  let res = await request(app)
    .get('/')
  t.is(res.statusCode, 200)
  t.true(res.text.includes('Login'))
  res = await request(app)
    .get('/?jwt=1a2b3c')
  t.true(res.text.includes('Logout'))
})

test('When user logs out, it clears jwt from cookie and redirects to /', async t => {
  const res = await request(app)
    .get('/logout')
  t.is(res.header.location, '/')
})

// New tests for showcase page
test('Showcase page with short URL works, if there is a latest successful revision', async t => {
  const res = await request(app)
    .get('/admin/demo-package')
  t.is(res.statusCode, 200)
  t.true(res.text.includes('Read me'))
  t.true(res.text.includes('DEMO - CBOE Volatility Index'))
})

test('Showcase page returns 200 if logged in and private dataset', async t => {
  const res = await request(app)
    .get('/admin/private-package')
    .set('Cookie', ['jwt=private-token'])
  t.is(res.statusCode, 200)
  t.true(res.text.includes('DataHub'))
})

test('Showcase page returns 404 not logged in and private dataset', async t => {
  const res = await request(app)
    .get('/admin/private-package')
  t.is(res.statusCode, 404)
})

test('Showcase page returns 404 if logged in but not owns private dataset', async t => {
  const res = await request(app)
    .get('/admin/private-package')
    .set('Cookie', ['jwt=another-token'])
  t.is(res.statusCode, 404)
})

test('Showcase page displays 404 if there is no successful revision found', async t => {
  const res = await request(app)
    .get('/bad-user/bad-package')
    .expect(404)
  t.is(res.text, 'Sorry, this page was not found.')
})

test('Showcase page returns 500 if status api times out', async t => {
  const res = await request(app)
    .get('/admin/timeout')
  t.is(res.statusCode, 500)
  t.is(res.text, 'Something failed. Please, try again later.')
})

test('Showcase with FULL URL works', async t => {
  const res = await request(app)
    .get('/admin/demo-package/v/1')
  t.is(res.statusCode, 200)
  t.true(res.text.includes('DEMO - CBOE Volatility Index'))
})

test('Showcase with FULL URL but not existing revision returns 404', async t => {
  const res = await request(app)
    .get('/admin/demo-package/v/4')
  t.is(res.statusCode, 404)
})

test('Showcase with FULL URL and INPROGRESS revision status uses original dp', async t => {
  const res = await request(app)
    .get('/admin/demo-package/v/2')
  t.is(res.statusCode, 200)
  t.true(res.text.includes('demo-package'))
})

test('Showcase with FULL URL and FAILED revision status uses original dp + shows failed pipelines with error logs', async t => {
  const res = await request(app)
    .get('/admin/demo-package/v/3')
  t.is(res.statusCode, 200)
  t.true(res.text.includes('demo-package'))
  t.true(res.text.includes('pipeline 1')) // Includes failed pipeline title
  t.true(res.text.includes('error 1')) // Includes error logs
  t.true(res.text.includes('error 2'))
  t.true(res.text.includes('Some of your data has validation errors.'))
})

test('Showcase displays validation error notice', async t => {
  const res = await request(app)
    .get('/admin/demo-package')
  t.is(res.statusCode, 200)
  t.true(res.text.includes('Some of your data has validation errors.'))
})
// end of new tests

test('"API" for datapackage.json file', async t => {
  let res = await request(app)
    .get('/admin/demo-package/datapackage.json')
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('/1/datapackage.json'))
})

test('"API" for datapackage.json returns 302 if logged in', async t => {
  const res = await request(app)
    .get('/admin/demo-package/datapackage.json')
    .set('Cookie', ['jwt=token'])
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('/1/datapackage.json'))
})

test('"API" for datapackage.json works if logged in and private dataset', async t => {
  const res = await request(app)
    .get('/admin/private-package/datapackage.json')
    .set('Cookie', ['jwt=private-token'])
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('/1/datapackage.json'))
})

test('"API" for datapackage.json returns 404 not logged in and private dataset', async t => {
  const res = await request(app)
    .get('/admin/private-package/datapackage.json')
    .expect(404)
  t.is(res.statusCode, 404)
})

test('Downloading a resource by name or index works for csv and json', async t => {
  let res = await request(app)
    .get('/admin/demo-package/r/demo-resource.csv')
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('_csv.csv'))
  res = await request(app)
    .get('/admin/demo-package/r/demo-resource.json')
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('_json.json'))
  res = await request(app)
    .get('/admin/demo-package/r/0.csv')
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('_csv.csv'))
  res = await request(app)
    .get('/admin/demo-package/r/0.json')
  t.is(res.statusCode, 302)
  t.true(res.header.location.includes('_json.json'))
})

test('Events page works', async t => {
  const notExist = await request(app)
    .get('/bad-user/bad-package/events')
  t.is(notExist.status, 404)

  const eventsPage = await request(app)
    .get('/admin/demo-package/events')
  t.true(eventsPage.text.includes('<!-- Events -->'))
})

test('Docs work', async t => {
  const res = await request(app).get('/docs')
  t.is(res.status, 200)
  t.true(res.text.includes('<!-- doc page -->'))
  t.true(res.text.includes('Documentation'))
})

test('Blog page works', async t => {
  let res = await request(app).get('/blog/space-usage')
  t.is(res.status, 200)
  t.true(res.text.includes('<!-- blog post page test placeholder -->'))
  res = await request(app).get('/blog')
  t.is(res.status, 200)
  t.true(res.text.includes('<!-- blog post page test placeholder -->'))
})

test('Search page returns 200 and has correct content', async t => {
  const res = await request(app)
    .get('/search?q=test')
    .expect(200)
  t.is(res.statusCode, 200)
  const html = res.text  // we get much cleaner debug this way
  t.true(html.includes('Search Datasets'))
  t.true(html.includes('Search for datasets'))
  t.true(html.includes('1 datasets found'))
  t.true(html.includes('Trends in Atmospheric Carbon Dioxide'))
})

test('Pricing page returns 200 and has correct content', async t => {
  const res = await request(app)
    .get('/pricing')
    .expect(200)
  t.is(res.statusCode, 200)
  t.true(res.text.includes('Private'))
})

test('Download page returns 200 and has correct content', async t => {
  const res = await request(app).get('/download')
  t.is(res.statusCode, 200)
  t.true(res.text.includes('<!-- download page test placeholder -->'))
})

test('Publisher page returns 200 and has correct content', async t => {
  const res = await request(app)
    .get('/publisher')
    .expect(200)
  t.is(res.statusCode, 200)
  t.true(res.text.includes('<h2 class="owner">publisher</h2>'))
  t.true(res.text.includes('Datasets <span class="badge" title="1 published datasets">1</span>'))
  t.true(res.text.includes('<!-- Events -->'))
})

test('Redirects from old to new website', async t => {
  // Testing only the most important ones
  let urls = ['/dataset', '/fr/dataset', '/dataset?res_format=CSV']
  for(let url of urls) {
    const expected = '/search'
    let res = await request(app).get(url)
    t.is(res.statusCode, 302)
    t.is(res.header.location, expected)
  }

  urls = ['/organization/core', '/dataset/core']
  for(let url of urls) {
    const expected = '/core'
    let res = await request(app).get(url)
    t.is(res.statusCode, 302)
    t.is(res.header.location, expected)
  }
})

test('Redirects to old.datahub.io', async t => {
  const old  = 'https://old.datahub.io'
  const urls = [
    '/organization',
    '/organization/abc',
    '/api',
    '/api/xyz',
    '/api/rest/v2/datasets',
    '/user',
    '/user/rufuspollock',
    '/tag',
    '/tag/abc',
    '/tag/abc?id=123'
  ]
  for(let url of urls) {
    const expected = old + url
    let res = await request(app).get(url)
    t.is(res.statusCode, 302)
    t.is(res.header.location, expected)
  }
})


// TODO: mock out upstream awesome repo urls so no dependency on external calls
test('awesome index page works', async t => {
  const res = await request(app).get('/awesome')
  t.is(res.status, 200)
  t.true(res.text.includes('awesome'))
})

// test('awesome theme page works', async t => {
//   const res = await request(app).get('/awesome/sport')
//   t.is(res.status, 200)
//   t.true(res.text.includes('sport'))
// })

test('awesome non existing page returns 404', async t => {
  const res = await request(app).get('/awesome/nonexistingpage')
  t.is(res.status, 200)
  t.true(res.text.includes('404'))
})
