'use strict'

const path = require('path')
const nconf = require('nconf')

nconf.file({
  file: path.join(__dirname, '/../../settings.json')
})

// This is the object that you want to override in your own local config
nconf.defaults({
  env: process.env.NODE_ENV || 'development',
  debug: process.env.DEBUG || false,
  app: {
    port: process.env.PORT || 4000
  },
  baseUrl: 'https://staging.datapackaged.com',
  bitstoreBaseUrl: 'https://bits-staging.datapackaged.com'
})

module.exports = {
  get: nconf.get.bind(nconf),
  set: nconf.set.bind(nconf),
  reset: nconf.reset.bind(nconf)
}
