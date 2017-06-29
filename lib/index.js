'use strict'

const urllib = require('url')
const rp = require('request-promise-native')

class DataHubApi {
  constructor(config) {
    this.config = config
    this.bitstoreUrl = config.get('bitstoreBaseUrl')
    this.baseUrl = config.get('baseUrl')
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

  async authenticate(jwt) {
    const url = `https://datax.phonaris.com/auth/check?jwt=${jwt}&next=${this.baseUrl}/success`
    const response = await rp.get(url)
    return JSON.parse(response)
  }
}

module.exports.DataHubApi = DataHubApi
