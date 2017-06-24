'use strict'

var express = require('express')
var request = require('request')

var config = require('../config')
var lib = require('../lib')

module.exports = function() {
  // eslint-disable-next-line new-cap
  var router = express.Router()

  router.get('/', function (req, res) {
    res.render('home.html', {
    });
	})

  router.get('/:owner/:name', async function (req, res) {
    const api = new lib.DataHubApi(config)
    const dpjson = await api.getPackage(req.params.owner, req.params.name)
    const readme = await api.getPackageFile(req.params.owner, req.params.name, 'README.md')
    const dpBitStoreUrl = [config.get('bitstoreBaseUrl'), 'metadata', req.params.owner, req.params.name, '_v', 'latest'].join('/')
    res.render('showcase.html', {
       dataset: dpjson,
       datapackageUrl: dpBitStoreUrl,
       readmeShort: '',
       readme_long: readme
    });
	})

  return router
}

