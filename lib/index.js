'use strict'

const urllib = require('url')
const rp = require('request-promise-native')

class DataHubApi {
  constructor(config) {
    this.config = config
    this.bitstoreUrl = config.get('bitstoreBaseUrl')
  }

  async getPackage(owner, name) {
    const dpjson = await this.getPackageFile(owner, name, 'datapackage.json')
    return JSON.parse(dpjson)
  }

  async getPackageFile(owner, name, path) {
    const url = urllib.resolve(this.bitstoreUrl,
        ['metadata', owner, name, '_v', 'latest', path].join('/')
        )
    const response = await rp.get({uri: url})
    return response
  }
}

module.exports.DataHubApi = DataHubApi

