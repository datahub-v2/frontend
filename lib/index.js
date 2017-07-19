'use strict'

const urllib = require('url')
const rp = require('request-promise-native')

class DataHubApi {
  constructor(config) {
    this.config = config
    this.bitstoreUrl = config.get('BITSTORE_URL')
    this.baseUrl = config.get('SITE_URL')
    this.DATAHUB_API = config.get('API_URL')
  }

  async getPackage(owner, name) {
    const dpjson = await this.getPackageFile(owner, name, 'datapackage.json')
    if (dpjson.error) {
      return dpjson
    }
    return JSON.parse(dpjson)
  }

  async getPackageFile(owner, name, path) {
    const url = urllib.resolve(this.bitstoreUrl,
        [owner, name, 'latest', path].join('/')
        )
    try {
      const response = await rp.get({uri: url})
      return response
    } catch (err) {
      return {
        error: true,
        name: err.statusCode,
        title: err.options.uri,
        message: err.message
      }
    }
  }

  async authenticate(jwt) {
    const url = `${this.DATAHUB_API}/auth/check?jwt=${jwt}&next=${this.baseUrl}/success`
    const response = await rp.get(url)
    return JSON.parse(response)
  }
}

module.exports.DataHubApi = DataHubApi
