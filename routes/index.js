'use strict'

const express = require('express')
const config = require('../config')
const lib = require('../lib')

module.exports = function () {
  // eslint-disable-next-line new-cap
  const router = express.Router()

  router.get('/', (req, res) => {
    res.render('home.html', {
    })
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

  return router
}
