const test = require('ava')

var config = require('../config')
var lib = require('../lib/')
var mocks = require('./fixtures')

mocks.initMocks()

const api = new lib.DataHubApi(config)
test('Gets datapackage.json (as extended)', async t => {
  let res = await api.getPackageFile('admin', 'demo-package', 'datapackage.json', 1)
  let dpjson = await res.json()
  t.is(dpjson.name, 'demo-package')
  t.is(dpjson.datahub.findability, 'published')
  t.is(dpjson.resources.length, 6)
})

test('Gets datapackage.json signedUrl', async t => {
  let res = await api.getPackageFile(
      'admin', 'private-package', 'datapackage.json', 1, 'token')
  let dpjson = await res.json()
  t.is(dpjson.name, 'demo-package')
  t.is(dpjson.datahub.findability, 'published')
  t.is(dpjson.resources.length, 6)
})

test("Generates logical dp from extended dp", async t => {
	const extended = require('./fixtures/extended-dp/datapackage.json')
	const logical = lib.DataHubApi.extendedToLogical(extended)
	// The main one has name of Original
	t.is(logical.resources[0].name, 'co2-mm-mlo')
  t.is(logical.resources[0].datahub.derivedFrom[0], 'co2-mm-mlo')
	// Original is in alternates
	t.is(extended.resources[17], logical.resources[5].alternates[0])
	// Json version is in alternates
	t.is(extended.resources[1], logical.resources[0].alternates[1])

  const extendedNonTabular = require('./fixtures/extended-dp-non-tabular/datapackage.json')
  const logicalNonTabular = lib.DataHubApi.extendedToLogical(extendedNonTabular)
  // It doesn't change anything except adding "report" root property:
  delete logicalNonTabular.report
  t.deepEqual(extendedNonTabular, logicalNonTabular)
})

test('Includes report resource in the first level "report" property', async t => {
  const extended = require('./fixtures/demo-package/datapackage.json')
  const logical = lib.DataHubApi.extendedToLogical(extended)
  t.is(logical.report.datahub.type, 'derived/report')
})

test('Generates good dp from prepareForFrontend dp', async t => {
  const dp = {resources:
    [
      {
        name: 'test',
        alternates: [
          {
            name: 'alt',
            datahub: {type: 'derived/json'}
          }
        ]
      }
    ]
  }
  const goodDp = await lib.DataHubApi.makeGoodDp(dp)
  t.is(goodDp.downloads[0].name, 'test')
  t.is(goodDp.downloads[0].otherFormats[0].name, 'alt')
})

test('Includes reports for each resource', async t => {
  const extended = require('./fixtures/demo-package/datapackage.json')
  const logical = lib.DataHubApi.extendedToLogical(extended)
  const withReport = await api.handleReport(logical)
  const parsedReport = JSON.parse(withReport.resources[0].report.replace(/\\"/g, '"'))
  t.is(parsedReport.resource, 'demo-resource')
  t.is(parsedReport.valid, false)
})

test('Gets README', async t => {
  const res = await api.getPackageFile('admin', 'demo-package', 'README.md', 1)
  const readme = await res.text()
  t.is(readme.slice(0,27), 'This README and datapackage')
})

test('Gets whole package', async t => {
  const dp = await api.getPackage('admin', 'demo-package', 1)
  t.is(dp.title, 'DEMO - CBOE Volatility Index')
  t.is(dp.datahub.owner, 'admin')
  t.is(dp.path, `${api.bitstoreUrl}${dp.datahub.ownerid}/${dp.name}/1`)
  t.is(dp.readme.slice(0,27), 'This README and datapackage')
  t.is(dp.readmeSnippet.length, 294)
  t.true(dp.readmeHtml.includes('<p>This README and datapackage'))
})

test('getPackage has normalized resources', async t => {
  const dp = await api.getPackage('admin', 'demo-package', 1)
  t.is(dp.resources.length, 2)
  t.is(dp.resources[0].name, 'demo-resource')
  t.is(dp.resources[0].datahub.derivedFrom[0], 'demo-resource')
  t.is(dp.resources[0].alternates.length, 3)
  // Check each alternates, should be: source, preview and json
  t.is(dp.resources[0].alternates[0].datahub.type, 'source/tabular')
  t.is(dp.resources[0].alternates[1].datahub.type, 'derived/preview')
  t.is(dp.resources[0].alternates[2].datahub.type, 'derived/json')
  // What is the second resource:
  t.is(dp.resources[1].name, 'datapackage_zip')
  // Test for prepareForFrontend applied
  t.is(dp.datahub.stats.prettyBytes, '86kB')
  t.is(dp.resources[0].prettyBytes, '122kB')
})

test('Gets list of packages', async t => {
  const listOfPkgIds = [
    {ownerid: 'core', name: 'country-list', revisionId: 1},
    {ownerid: 'core', name: 's-and-p-500-companies', revisionId: 1}
  ]
  const listOfDp = await api.getPackages(listOfPkgIds)
  t.is(listOfDp.length, 2)
  t.is(listOfDp[1].title, 'DEMO - CBOE Volatility Index')
  // t.is(listOfDp[1].owner, 'core')
  t.is(listOfDp[1].readme.slice(0,27), 'This README and datapackage')
})

test('Handles errors if file cannot be retrieved', async t => {
  let res = await api.getPackageFile('bad-user', 'bad-package', 'datapackage.json', 1)
  t.is(res.status, 404)
})

test('Handles errors if file cannot be retrieved', async t => {
  const res = await api.authenticate() // Without jwt so we get urls for login
  t.is(res.authenticated, false)
  t.deepEqual(res.providers.github,{ url: 'https://github.com/login/' })
  t.deepEqual(res.providers.google,{ url: 'https://accounts.google.com/o/oauth2/auth' })
})

test('Metastore API wrapper (search) function works', async t => {
  let query = 'q="test"&size=20'
  let res = await api.search(query)
  let logical = require('./fixtures/logical-dp/datapackage.json')
  t.is(res.results[0].resources.length, logical.resources.length)
  t.is(res.summary.total, 1)
  t.is(res.results[0].datahub.owner, 'core')
  t.is(res.results[0].datahub.stats.prettyBytes, '192kB')
  t.is(res.results[0].readmeSnippet.length, 293)
})

test('Metastore API wrapper (events) function works', async t => {
  let query = 'owner="publisher"&size=10'
  let res = await api.getEvents(query)
  t.is(res.results.length, 1)
})

test('Filemanager API works', async t => {
  let owner = 'admin'
  let pkgId = 'demo-package'
  let flowId = 1
  let res = await api.getStorage({owner})
  t.is(res.totalBytes, 1234)
  res = await api.getStorage({owner, pkgId})
  t.is(res.totalBytes, 123)
  res = await api.getStorage({owner, pkgId, flowId})
  t.is(res.totalBytes, 12)
})

test('Authenticates with GitHub using given jwt and returns user info', async t => {
  const jwt = '1a2b3c'
  const res = await api.authenticate(jwt)
  t.is(res.authenticated, true)
  t.is(res.profile.email, 'test_username_but_not_email')
  t.is(res.profile.name, 'Firstname Secondname')
})

test('Authenticates with GOOGLE using given jwt and returns user info', async t => {
  const jwt = '1a2b3c4d'
  const res = await api.authenticate(jwt)
  t.is(res.authenticated, true)
  t.is(res.profile.email, 'actual_email@gmail.com')
  t.is(res.profile.name, 'Firstname Secondname')
})

test('specStoreStatus hits status API with revision-id', async t => {
  const ownerid = 'admin'
  const name = 'demo-package'
  // Can get status for specific succeeded revision
  let res = await api.specStoreStatus(ownerid, name, 1)
  t.is(res.state, 'SUCCEEDED')
  // Can get status for specific in progress revision
  res = await api.specStoreStatus(ownerid, name, 2)
  t.is(res.state, 'INPROGRESS')
  // Can get status for the latest revision
  res = await api.specStoreStatus(ownerid, name, 'latest')
  t.is(res.state, 'INPROGRESS')
  // Can get status for the latest successful revision
  res = await api.specStoreStatus(ownerid, name, 'successful')
  t.is(res.state, 'SUCCEEDED')
  t.is(res.id.split('/')[2], '1')
  // If no such revision, returns 404
  res = await t.throws(api.specStoreStatus(ownerid, name, 4))
  t.is(res.status, 404)
})

test('getProfile method works', async t => {
  const owner = 'admin'
  const res = await api.getProfile(owner)
  const exp = {
    found: true,
    profile: {
      id: 'admin',
      join_date: 'Mon, 24 Jul 2017 12:17:50 GMT'
    }
  }
  t.deepEqual(res, exp)

  const notExist = 'notexist'
  const badRes = await api.getProfile(notExist)
  const expBadRes = {
    found: false,
    profile: null
  }
  t.deepEqual(badRes, expBadRes)
})

test('Resolves path', async t => {
  const path_ = 'publisher/package'
  const res = await api.resolve(path_)
  t.is(res.userid, 'publisher')
  t.is(res.packageid, 'package')
})
