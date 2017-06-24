'use string'

var nock = require('nock')
var config = require('../../config')
var fs = require('fs')

module.exports.dataPackage = require('./datapackage.json')
module.exports.readme = fs.readFileSync('README.md')

module.exports.initMocks = function() {
  var data = module.exports
  nock(config.get('bitstoreBaseUrl'))
    .persist()
    .get('metadata/admin/demo-package/_v/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})

  nock(config.get('bitstoreBaseUrl'))
    .persist()
    .get('metadata/admin/demo-package/_v/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
}
