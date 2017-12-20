'use string'

var nock = require('nock')
var config = require('../../config')
var fs = require('fs')

module.exports.dataPackage = require('./demo-package/datapackage.json')
module.exports.readme = fs.readFileSync('tests/fixtures/demo-package/README.md').toString()
module.exports.reportResource = require('./reports/report-resource.json')
module.exports.failedReport = require('./reports/failed-report.json')

module.exports.initMocks = function() {
  var data = module.exports
  nock(config.get('BITSTORE_URL'))
    .persist()
    .get('/admin/demo-package/1/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/admin/private-package/1/datapackage.json')
    .reply(403, {})
    .get('/admin/demo-package/1/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/bad-user/bad-package/1/datapackage.json')
    .reply(404, "not found", {'access-control-allow-origin': '*'})
    .get('/bad-user/bad-package/latest/datapackage.json')
    .reply(404, "not found", {'access-control-allow-origin': '*'})
    .get('/admin/running-package/1/datapackage.json')
    .reply(404, "not found", {'access-control-allow-origin': '*'})
    .get('/admin/failed-package/1/datapackage.json')
    .reply(404, "not found", {'access-control-allow-origin': '*'})
    .get('/core/co2-ppm/1/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/core/co2-ppm/1/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/core/house-prices-us/1/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/core/house-prices-us/1/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/core/gold-prices/1/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/core/gold-prices/1/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/examples/simple-graph-spec/1/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/examples/simple-graph-spec/1/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/examples/vega-views-tutorial-lines/1/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/examples/vega-views-tutorial-lines/1/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/examples/geojson-tutorial/1/datapackage.json')
    .reply(200, data.dataPackage, {'access-control-allow-origin': '*'})
    .get('/examples/geojson-tutorial/1/README.md')
    .reply(200, data.readme, {'access-control-allow-origin': '*'})
    .get('/admin/demo-package/validation_report/data/some_hash/validation_report.json')
    .reply(200, data.failedReport)

  // Mock api calls for Metastore (search)
  // TODO: 2017-08-11 ~rufuspollock construct extended DP ourselves from an input fixture package so that we can test more cleanly
  nock(config.get('API_URL'))
    .persist()
    .get('/rawstore/presign?jwt=token&ownerid=admin&url=http://127.0.0.1:4000/static/fixtures/admin/private-package/1/datapackage.json')
    .reply(200, {
        "url": config.get('BITSTORE_URL')+"admin/demo-package/1/datapackage.json"
      })
    .get('/rawstore/presign?jwt=simple-token&ownerid=admin&url=http://127.0.0.1:4000/static/fixtures/admin/private-package/1/datapackage.json')
    .reply(200, {
        "url": config.get('BITSTORE_URL')+"admin/demo-package/1/datapackage.json"
      })
    .get('/core/finance-vix/vix-daily_csv/data/11e6ae1c776100998d85ce356ca006a5/vix-daily_csv.csv')
    .reply(403)
    .get('/core/finance-vix/datapackage_zip/data/6f918bd7cd25aed8b5bb9e55fffed4ee/datapackage_zip.zip')
    .reply(403)
    .get('/core/finance-vix/vix-daily_csv_preview/data/93ec001dba9e7c42db532f048a933802/vix-daily_csv_preview.json')
    .reply(403)
    .get('/rawstore/presign?jwt=token&ownerid=admin&url=http://0.0.0.0:4000/core/finance-vix/vix-daily_csv/data/11e6ae1c776100998d85ce356ca006a5/vix-daily_csv.csv')
    .reply(200, {url: 'http://signed-url.com'})
    .get('/rawstore/presign?jwt=token&ownerid=admin&url=http://0.0.0.0:4000/core/finance-vix/datapackage_zip/data/6f918bd7cd25aed8b5bb9e55fffed4ee/datapackage_zip.zip')
    .reply(200, {url: 'http://signed-url.com'})
    .get('/rawstore/presign?jwt=token&ownerid=admin&url=http://0.0.0.0:4000/core/finance-vix/vix-daily_csv_preview/data/93ec001dba9e7c42db532f048a933802/vix-daily_csv_preview.json')
    .reply(200, {url: 'http://signed-url.com'})

  nock(config.get('API_URL'), {reqheaders: {'Auth-Token': 'token'}})
    .persist()
    .get('/auth/authorize?service=frontend')
    .reply(200, {"token": "simple-token"})

  nock(config.get('API_URL'), {reqheaders: {'Auth-Token': 'private-token'}})
    .persist()
    .get('/auth/authorize?service=frontend')
    .reply(200, {"token": "token"})

  nock(config.get('API_URL'), {reqheaders: {'Auth-Token': 'another-token'}})
    .persist()
    .get('/auth/authorize?service=frontend')
    .reply(200, {"token": "another"})
  nock(config.get('API_URL'))
    .persist()
    .get('/rawstore/presign?jwt=another&ownerid=admin&url=http://127.0.0.1:4000/static/fixtures/admin/private-package/1/datapackage.json')
    .reply(403)

  const extendedDp = require('./extended-dp/datapackage.json')
  nock(config.get('API_URL'))
    .persist()
    .get('/metastore/search?q=%22test%22&size=20')
    .reply(200, {
      summary: {
        total: 1
      },
      results: [
        {
          datapackage: extendedDp
        }
      ]
    })
    .get('/metastore/search?datahub.ownerid=%22publisher%22&size=100')
    .reply(200, {
      summary: {
        total: 1
      },
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
    .get('/metastore/search?datahub.ownerid=%22publisher%22&size=0')
    .reply(200, {
      summary: {
        total: 1,
        totalBytes: 1234567
      },
      results: []
    })

  // Mock api calls for Metastore (events)
  nock(config.get('API_URL'))
    .persist()
    .get('/metastore/search/events?owner=%22publisher%22&size=10')
    .reply(200, {
      results: [
        {
          event_entity: 'flow',
          timestamp: '2017-10-20T08:45:25'
        }
      ],
      summary: { total: 36, totalBytes: 0 }
    })
    .get('/metastore/search/events?owner=%22admin%22&dataset=%22demo-package%22')
    .reply(200, {
      results: [
        {
          event_entity: 'flow',
          timestamp: '2017-10-20T08:45:25'
        }
      ],
      summary: { total: 36, totalBytes: 0 }
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
  const specContents = {
    inputs: [
      {
        parameters: {
          descriptor: data.dataPackage
        }
      }
    ],
    meta: {findability: 'published'}
  }
  nock(`${config.get('API_URL')}`)
    .persist()
    .get('/source/admin/demo-package/1')
    .reply(200, {
      id: 'admin/demo-package/1',
      state: 'SUCCEEDED',
      spec_contents: specContents
    })
    .get('/source/admin/demo-package/2')
    .reply(200, {
      id: 'admin/demo-package/2',
      state: 'INPROGRESS',
      spec_contents: specContents
    })
    .get('/source/admin/demo-package/3')
    .reply(200, {
      id: 'admin/demo-package/3',
      state: 'FAILED',
      spec_contents: specContents,
      pipelines: {
        key1: {
          title: 'pipeline 1',
          status: 'FAILED',
          error_log: ['error 1', 'error 2']
        },
        validation_report: {
          title: 'Validating package contents',
          status: 'SUCCEEDED',
          stats: {
            '.dpp': {'out-datapackage-url': 'http://0.0.0.0:4000/report-resource.json'}
          }
        }
      }
    })
    .get('/source/admin/demo-package/4')
    .reply(404)
    .get('/source/admin/demo-package/latest')
    .reply(200, {
      state: 'INPROGRESS'
    })
    .get('/source/admin/demo-package/successful')
    .reply(200, {
      id: 'admin/demo-package/1',
      state: 'SUCCEEDED',
      spec_contents: specContents
    })
    .get('/source/admin/timeout/successful')
    .socketDelay(7000)
    .reply(502)
    .get('/source/admin/private-package/successful')
    .reply(200, {
      id: 'admin/private-package/1',
      state: 'SUCCEEDED',
      spec_contents: {meta: {findability: 'private'}}
    })
    .get('/source/bad-user/bad-package/successful')
    .reply(404)
    .get('/source/core/co2-ppm/successful')
    .reply(200, {
      id: 'core/co2-ppm/1',
      state: 'SUCCEEDED'
    })
    .get('/source/core/house-prices-us/successful')
    .reply(200, {
      id: 'core/house-prices-us/1',
      state: 'SUCCEEDED'
    })
    .get('/source/core/gold-prices/successful')
    .reply(200, {
      id: 'core/gold-prices/1',
      state: 'SUCCEEDED'
    })
    .get('/source/examples/simple-graph-spec/successful')
    .reply(200, {
      id: 'examples/simple-graph-spec/1',
      state: 'SUCCEEDED'
    })
    .get('/source/examples/vega-views-tutorial-lines/successful')
    .reply(200, {
      id: 'examples/vega-views-tutorial-lines/1',
      state: 'SUCCEEDED'
    })
    .get('/source/examples/geojson-tutorial/successful')
    .reply(200, {
      id: 'examples/geojson-tutorial/1',
      state: 'SUCCEEDED'
    })

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
    .get('/resolve?path=admin/private-package')
    .reply(200, {
      userid: 'admin',
      packageid: 'private-package'
    })
    .get('/resolve?path=admin/timeout')
    .reply(200, {
      userid: 'admin',
      packageid: 'timeout'
    })

  // Mock for returning reports:
  nock(config.get('API_URL'))
    .persist()
    .get('/report-resource.json')
    .reply(200, require('./reports/report-resource.json'))
    .get('/datapackage_report.json')
    .reply(200, require('./reports/failed-report.json'))

  // Mock for Filemanager API:
  nock(config.get('API_URL'))
    .persist()
    .get('/storage/owner/admin')
    .reply(200, {totalBytes: 1234})
    .get('/storage/dataset_id/admin/demo-package')
    .reply(200, {totalBytes: 123})
    .get('/storage/flow_id/admin/demo-package/1')
    .reply(200, {totalBytes: 12})
}
