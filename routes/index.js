'use strict'

const express = require('express')
const config = require('../config')
const lib = require('../lib')

module.exports = function () {
  // eslint-disable-next-line new-cap
  const router = express.Router()

  router.get('/', function (req, res) {
    // TODO: check if a user is signed in here later + add tests:
    if (false) {
      res.render('dashboard.html', {
        title: 'Dashboard'
      });
    }
    res.render('home.html', {
      title: 'Home'
    });
	})

  router.get('/:owner/:name', async (req, res) => {
    const api = new lib.DataHubApi(config)
    const dpjson = await api.getPackage(req.params.owner, req.params.name)
    const readme = await api.getPackageFile(req.params.owner, req.params.name, 'README.md')
    const dpBitStoreUrl = [config.get('bitstoreBaseUrl'), 'metadata', req.params.owner, req.params.name, '_v', 'latest'].join('/')
    res.render('showcase.html', {
      dataset: dpjson,
      datapackageUrl: dpBitStoreUrl,
      readmeShort: '',
			// eslint-disable-next-line camelcase
      readme_long: readme
    })
  })

  router.get('/search', function (req, res) {
    res.render('search.html', {

    });
  })

  router.get('/:owner', function (req, res) {
    res.render('owner.html', {

    });
  })

  return router
}
