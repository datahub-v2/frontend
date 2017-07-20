'use strict'
const urllib = require('url')

const fetch = require('node-fetch')


class DataHubApi {
  constructor(config) {
    this.config = config
    this.bitstoreUrl = config.get('BITSTORE_URL')
    this.baseUrl = config.get('SITE_URL')
    this.DATAHUB_API = config.get('API_URL')
  }

  // get a datapackage.json including its readme inline (if readme exists)
  async getPackage(owner, name) {
    const res = await this.getPackageFile(owner, name)
    if (res.status != 200) {
      throw {
        name: 'BadStatusCode',
        message: `Bad response from pkg store for ${owner}/${name}`,
        res: res
      }
    }
    // TODO: handle 404'ing
    let dp = await res.json()
    dp.owner = owner

    const readmeRes = await this.getPackageFile(owner, name, 'README.md')
    console.log(readmeRes.status)
    // ignore 404s etc
    if (readmeRes.status === 200) {
      dp.readme = await readmeRes.text()
    } else {
      // TODO: debug
      console.log(`README not found for package ${owner}/${name}`)
      dp.readme = ''
    }

    // TODO:
    // dp.readmeSnippet
    // dp.readmeHtml
    return dp
  }

  /**
  * Get a list of packages with readme and owner info
  *
  * Note: if data package 404s on backend (or errors) we just skip (rather than error)
  *
  * @param {Array} array of package owner and name objects: [{owner: '', name: ''}]
  * @return {Array} array of datapackages with readme and owner info
  */
  async getPackages(arrayOfPackageIds) {
    // TODO: use getPackage with PromiseAll ... (and handling errors)
  }

  async getPackageFile(owner, name, path='datapackage.json') {
    const url = urllib.resolve(this.bitstoreUrl,
        [owner, name, 'latest', path].join('/')
        )
    const response = await fetch(url)
    return response
  }

  async authenticate(jwt) {
    const url = `${this.DATAHUB_API}/auth/check?jwt=${jwt}&next=${this.baseUrl}/success`
    const response = await fetch(url)
    const out = await response.json()
    return out
  }
}

module.exports.DataHubApi = DataHubApi
