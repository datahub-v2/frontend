'use string'

var nock = require('nock')
var config = require('../../config')
var fs = require('fs')

module.exports.dataPackage = require('./demo-package/datapackage.json')
module.exports.readme = fs.readFileSync('tests/fixtures/demo-package/README.md').toString()

module.exports.initMocks = function() {
  var data = module.exports
  nock(config.get('BITSTORE_URL'))
    .persist()
    .get('/admin/demo-package/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/admin/demo-package/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/bad-user/bad-package/latest/datapackage.json')
    .reply(404, "not found", {'access-control-allow-origin': '*'})
    .get('/admin/running-package/latest/datapackage.json')
    .reply(404, "not found", {'access-control-allow-origin': '*'})
    .get('/admin/failed-package/latest/datapackage.json')
    .reply(404, "not found", {'access-control-allow-origin': '*'})
    .get('/core/co2-ppm/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/core/co2-ppm/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/core/house-prices-us/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/core/house-prices-us/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/core/gold-prices/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/core/gold-prices/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/examples/simple-graph-spec/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/examples/simple-graph-spec/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/examples/vega-views-tutorial-lines/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/examples/vega-views-tutorial-lines/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/examples/geojson-tutorial/latest/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/examples/geojson-tutorial/latest/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})

  // Mock api calls for Metastore
  const extendedDp = require('./extended-dp/datapackage.json')
  nock(config.get('API_URL'))
    .persist()
    .get('/metastore/search?q=%22test%22&size=20')
    .reply(200, {
      total: 1,
      results: [
        {
          datapackage: extendedDp
        }
      ]
    })
    .get('/metastore/search?datahub.ownerid=%22publisher%22&size=20')
    .reply(200, {
      total: 1,
      results: [
        {
          name: 'package',
          datahub: {
            owner: 'publisher'
          },
          datapackage: extendedDp
        }
      ]
    })

  // Mock api calls for authentication
  // Not authenticated returns urls for login
  nock(config.get('API_URL'))
    .persist()
    .get(`/auth/check?jwt=undefined&next=${config.get('SITE_URL')}/success`)
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
  nock(config.get('API_URL'))
    .persist()
    .get(`/auth/check?jwt=1a2b3c&next=${config.get('SITE_URL')}/success`)
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
  nock(config.get('API_URL'))
    .persist()
    .get(`/auth/check?jwt=1a2b3c4d&next=${config.get('SITE_URL')}/success`)
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

  // status api
  nock(`${config.get('API_URL')}`)
    .persist()
    .get('/source/admin/running-package/status')
    .reply(200, {
      state: 'RUNNING',
      logs: ['log1', 'log2']
    })
    .get('/source/admin/running-package/info')
    .reply(404)
    .get('/source/admin/failed-package/status')
    .reply(200, {
      state: 'FAILED'
    })
    .get('/source/admin/failed-package/info')
    .reply(200, {
      state: 'FAILED',
      error_log: ['err1', 'err2'],
      source: {
        meta: {
          dataset: 'failed-package',
          owner: 'admin'
        }
      }
    })
    .get('/source/admin/demo-package/status')
    .reply(200, {
      state: 'SUCCEEDED'
    })
    .get('/source/admin/demo-package/info')
    .reply(200, {
      state: 'SUCCEEDED',
      logs: ['log1', 'log2'],
      source: {
        meta: {
          dataset: 'demo-package',
          owner: 'admin'
        }
      }
    })
    .get('/source/core/house-prices-us/status')
    .reply(200, {
      state: 'RUNNING'
    })
    .get('/source/core/gold-prices/status')
    .reply(200, {
      state: 'FAILED'
    })
    .get('/source/bad-user/bad-package/status')
    .reply(404)
    .get('/source/bad-user/bad-package/info')
    .reply(404)

  nock(`${config.get('API_URL')}/auth`)
    .persist()
    .get('/get_profile?username=admin')
    .reply(200, {
      found: true,
      profile: {
        id: 'admin',
        join_date: 'Mon, 24 Jul 2017 12:17:50 GMT'
      }
    })
    .get('/get_profile?username=notexist')
    .reply(200, {
      found: false,
      profile: null
    })
    .get('/get_profile?username=publisher')
    .reply(200, {
      found: true,
      profile: {
        id: 'publisher',
        join_date: 'Mon, 24 Jul 2017 12:17:50 GMT'
      }
    })

  // resolver api
  nock(`${config.get('API_URL')}/resolver`)
    .persist()
    .get('/resolve?path=publisher/package')
    .reply(200, {
      userid: 'publisher',
      packageid: 'package'
    })
    .get('/resolve?path=admin/demo-package')
    .reply(200, {
      userid: 'admin',
      packageid: 'demo-package'
    })
    .get('/resolve?path=bad-user/bad-package')
    .reply(200, {
      userid: 'bad-user',
      packageid: 'bad-package'
    })
    .get('/resolve?path=admin/running-package')
    .reply(200, {
      userid: 'admin',
      packageid: 'running-package'
    })
    .get('/resolve?path=admin/failed-package')
    .reply(200, {
      userid: 'admin',
      packageid: 'failed-package'
    })
    .get('/resolve?path=core/house-prices-us')
    .reply(200, {
      userid: 'core',
      packageid: 'house-prices-us'
    })
    .get('/resolve?path=core/gold-prices')
    .reply(200, {
      userid: 'core',
      packageid: 'gold-prices'
    })
}
