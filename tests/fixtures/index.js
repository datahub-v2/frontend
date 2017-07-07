'use string'

var nock = require('nock')
var config = require('../../config')
var fs = require('fs')

module.exports.dataPackage = require('./demo-package/datapackage.json')
module.exports.readme = fs.readFileSync('tests/fixtures/demo-package/README.md').toString()

module.exports.initMocks = function() {
  var data = module.exports
  nock(config.get('bitstoreBaseUrl'))
    .persist()
    .get('/metadata/admin/demo-package/_v/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/metadata/admin/demo-package/_v/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/metadata/core/s-and-p-500-companies/_v/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/metadata/core/s-and-p-500-companies/_v/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/metadata/core/house-prices-us/_v/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/metadata/core/house-prices-us/_v/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/metadata/core/gold-prices/_v/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/metadata/core/gold-prices/_v/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/metadata/examples/simple-graph-spec/_v/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/metadata/examples/simple-graph-spec/_v/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/metadata/examples/vega-views-tutorial-lines/_v/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/metadata/examples/vega-views-tutorial-lines/_v/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/metadata/examples/geojson-tutorial/_v/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/metadata/examples/geojson-tutorial/_v/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})

  // Mock api calls for authentication
  // Not authenticated returns urls for login
  nock(config.get('DATAHUB_API'))
    .persist()
    .get(`/auth/check?jwt=undefined&next=${config.get('baseUrl')}/success`)
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
  nock(config.get('DATAHUB_API'))
    .persist()
    .get(`/auth/check?jwt=1a2b3c&next=${config.get('baseUrl')}/success`)
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
  nock(config.get('DATAHUB_API'))
    .persist()
    .get(`/auth/check?jwt=1a2b3c4d&next=${config.get('baseUrl')}/success`)
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
}
