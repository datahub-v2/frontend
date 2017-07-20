'use strict';

var assert = require('assert')

var config = require('../config')
var lib = require('../lib/')
var mocks = require('./fixtures')

mocks.initMocks()

describe('Lib', () => {
  const api = new lib.DataHubApi(config)

  it('Gets datapackage.json', async () => {
    let res = await api.getPackageFile('admin', 'demo-package')
    let dpjson = await res.json()
    assert.equal(dpjson.name, 'demo-package')
    assert.equal(dpjson.resources.length, 1)
  })

  it('Gets README', async () => {
    const res = await api.getPackageFile('admin', 'demo-package', 'README.md')
    const readme = await res.text()
    assert.equal(readme.slice(0,27), 'This README and datapackage')
  })

  it('Gets whole package', async () => {
    const dp = await api.getPackage('admin', 'demo-package')
    assert.equal(dp.title, 'DEMO - CBOE Volatility Index')
    assert.equal(dp.owner, 'admin')
    assert.equal(dp.path, 'http://127.0.0.1:4000/static/fixtures/admin/demo-package/latest')
    assert.equal(dp.readme.slice(0,27), 'This README and datapackage')
    assert.equal(dp.readmeSnippet.length, 294)
    assert(dp.readmeHtml.includes('<p>This README and datapackage'))
  })

  it('Gets list of packages', async () => {
    const listOfPkgIds = [
      {owner: 'core', name: 's-and-p-500-companies'},
      {owner: 'core', name: 'house-prices-us'}
    ]
    const listOfDp = await api.getPackages(listOfPkgIds)
    assert.equal(listOfDp.length, 2)
    assert.equal(listOfDp[1].title, 'DEMO - CBOE Volatility Index')
    assert.equal(listOfDp[1].owner, 'core')
    assert.equal(listOfDp[1].readme.slice(0,27), 'This README and datapackage')
  })

  it('Handles errors if file cannot be retrieved', async () => {
    let res = await api.getPackageFile('bad-user', 'bad-package')
    assert.equal(res.status, 404)
  })

  it('Authenticate function returns urls for login - GitHub and Google', async () => {
    const res = await api.authenticate() // Without jwt so we get urls for login
    assert.equal(res.authenticated, false)
    assert(res.providers.github)
    assert(res.providers.google)
  })

  it('Authenticates with GitHub using given jwt and returns user info', async () => {
    const jwt = '1a2b3c'
    const res = await api.authenticate(jwt)
    assert.equal(res.authenticated, true)
    assert.equal(res.profile.email, 'test_username_but_not_email')
    assert.equal(res.profile.name, 'Firstname Secondname')
  })

  it('Authenticates with GOOGLE using given jwt and returns user info', async () => {
    const jwt = '1a2b3c4d'
    const res = await api.authenticate(jwt)
    assert.equal(res.authenticated, true)
    assert.equal(res.profile.email, 'actual_email@gmail.com')
    assert.equal(res.profile.name, 'Firstname Secondname')
  })
})
