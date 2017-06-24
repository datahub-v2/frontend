'use strict';

var assert = require('assert')

var config = require('../config')
var lib = require('../lib/')
var mocks = require('./fixtures')

mocks.initMocks()

describe('Lib', () => {
  it('Gets datapackage.json', async () => {
    let api = new lib.DataHubApi(config)
    let dpjson = await api.getPackage('admin', 'demo-package')
    assert.equal(dpjson.name, 'demo-package')
    assert.equal(dpjson.resources.length, 1)
  });

  it('Gets README', async () => {
    let api = new lib.DataHubApi(config)
    let readme = await api.getPackageFile('admin', 'demo-package', 'README.md')
    assert.equal(readme.slice(0,27), 'DataHub frontend in node.js')
  });
})
