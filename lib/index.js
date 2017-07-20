'use strict'
const urllib = require('url')

const fetch = require('node-fetch')
const utils = require('./utils')

class DataHubApi {
  constructor(config) {
    this.config = config
    this.bitstoreUrl = config.get('BITSTORE_URL')
    this.baseUrl = config.get('SITE_URL')
    this.DATAHUB_API = config.get('API_URL')
  }

  // Get a datapackage.json including its readme inline (if readme exists)
  async getPackage(owner, name) {
    const res = await this.getPackageFile(owner, name)
    if (res.status !== 200) {
      // eslint-disable-next-line no-throw-literal
      throw {
        name: 'BadStatusCode',
        message: `Bad response from pkg store for ${owner}/${name}`,
        res
      }
    }
    // TODO: handle 404'ing
    const dp = await res.json()
    // Making a copy of dp to use in the compiled README
    const initialDp = Object.assign({}, dp)
    dp.owner = owner
    dp.path = urllib.resolve(this.bitstoreUrl,
        [owner, name, 'latest'].join('/')
        )

    const readmeRes = await this.getPackageFile(owner, name, 'README.md')
    // ignore 404s etc
    if (readmeRes.status === 200) {
      dp.readme = await readmeRes.text()
    } else {
      // TODO: debug
      console.log(`README not found for package ${owner}/${name}`)
      dp.readme = ''
    }

    dp.readmeSnippet = utils.makeSmallReadme(dp.readme)
    const readmeCompiled = utils.dpInReadme(dp.readme, initialDp)
    dp.readmeHtml = utils.textToMarkdown(readmeCompiled)
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
    // Use getPackage with PromiseAll ... (and handling errors)
    return Promise.all(arrayOfPackageIds.map(pkgId => {
      return this.getPackage(pkgId.owner, pkgId.name)
    })).catch(err => {
      console.log(err)
    })
  }

  async getPackageFile(owner, name, path = 'datapackage.json') {
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
