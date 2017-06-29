'use strict';

var assert = require('assert')
var nock = require('nock')

var config = require('../config')
var lib = require('../lib/')
var mocks = require('./fixtures')

mocks.initMocks()

// Mock api calls for authentication
// Not authenticated returns urls for login
nock('https://datax.phonaris.com')
  .persist()
  .get('/auth/check?jwt=undefined&next=https://staging.datapackaged.com/success')
  .reply(200, {
    "authenticated": false,
    "providers": {
      "github": {
        "url": "https://github.com/login/"
      },
      "google": {
        "url": "https://accounts.google.com/o/oauth2/auth"
      }
    }
  })
// GitHub
nock('https://datax.phonaris.com')
  .persist()
  .get('/auth/check?jwt=1a2b3c&next=https://staging.datapackaged.com/success')
  .reply(200, {
    "authenticated": true,
    "profile": {
      "avatar_url": "https://avatars2.githubusercontent.com/u/000000?v=3",
      "email": "test_username_but_not_email",
      "id": "123456abc",
      "join_date": "Tue, 27 Jun 2017 10:15:05 GMT",
      "name": "Firstname Secondname",
      "provider_id": "github:17809581",
      "username": null
    }
  })
// GOOGLE
nock('https://datax.phonaris.com')
  .persist()
  .get('/auth/check?jwt=1a2b3c4d&next=https://staging.datapackaged.com/success')
  .reply(200, {
    "authenticated": true,
    "profile": {
      "avatar_url": "https://lh4.googleusercontent.com/photo.jpg",
      "email": "actual_email@gmail.com",
      "id": "123456abc",
      "join_date": "Tue, 27 Jun 2017 10:58:08 GMT",
      "name": "Firstname Secondname",
      "provider_id": "google:117985331094635516621",
      "username": null
    }
  })

describe('Lib', () => {
  const api = new lib.DataHubApi(config)

  it('Gets datapackage.json', async () => {
    let dpjson = await api.getPackage('admin', 'demo-package')
    assert.equal(dpjson.name, 'demo-package')
    assert.equal(dpjson.resources.length, 1)
  })

  it('Gets README', async () => {
    let readme = await api.getPackageFile('admin', 'demo-package', 'README.md')
    assert.equal(readme.slice(0,27), 'This README and datapackage')
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
