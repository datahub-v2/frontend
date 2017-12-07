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
    this.METASTORE_API = config.get('METASTORE_URL')
    this.AUTH_API = config.get('AUTH_URL')
    this.FLOWMANAGER_API = config.get('FLOWMANAGER_URL')
    this.RESOLVER_API = config.get('RESOLVER_URL')
  }

  // Get a datapackage.json including its readme inline (if readme exists)
  async getPackage(ownerid, name, token=null) {
    const res = await this.getPackageFile(ownerid, name, 'datapackage.json', token)
    if (res.status !== 200) {
      // eslint-disable-next-line no-throw-literal
      throw {
        name: 'BadStatusCode',
        message: `Bad response from pkg store for ${ownerid}/${name}`,
        res
      }
    }
    // TODO: handle 404'ing
    let dp = await res.json()
    dp = DataHubApi.extendedToLogical(dp)
    // Making a copy of dp to use in the compiled README
    const initialDp = Object.assign({}, dp)

    dp.path = urllib.resolve(
      this.bitstoreUrl,
      [ownerid, name, 'latest'].join('/')
    )

    // We might already have readme set - e.g. if it has already been inlined ...
    if (!dp.readme) {
      const readmeRes = await this.getPackageFile(ownerid, name, 'README.md', token)
      // ignore 404s etc
      if (readmeRes.status === 200) {
        dp.readme = await readmeRes.text()
      } else {
        // TODO: debug
        console.log(`README not found for package ${ownerid}/${name}`)
        dp.readme = ''
      }
    }

    dp.readmeSnippet = utils.makeSmallReadme(dp.readme)
    // TODO: we should use original dp here:
    const readmeCompiled = utils.dpInReadme(dp.readme, initialDp)
    dp.readmeHtml = utils.textToMarkdown(readmeCompiled)
    // Do preparations for frontend, e.g. convert bytes into human-readable
    dp = utils.prepareForFrontend(dp)
    dp = DataHubApi.makeGoodDp(dp)
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
      return this.getPackage(pkgId.ownerid, pkgId.name)
    })).catch(err => {
      console.log(err)
    })
  }

  async getPackageFile(ownerid, name, path = 'datapackage.json', token=null) {
    const url = urllib.resolve(this.bitstoreUrl,
        [ownerid, name, 'latest', path].join('/')
        )
    let response = await fetch(url)
    if (response.status === 403) {
      if (!token) {
        throw { name: 'Forbidden', message: `Not allowed`, res: response }
      }
      const signedUrl = await this.checkForSignedUrl(url, ownerid, token)
      response = await fetch(signedUrl.url)
    }
    return response
  }

  async checkForSignedUrl(url, ownerid, token, authzToken) {
    if (!authzToken) {
      authzToken = await this.authz(token)
    }
    const urlToChek = urllib.resolve(
        this.DATAHUB_API, `rawstore/presign?jwt=${authzToken}&ownerid=${ownerid}&url=${url}`
        )
    const response = await fetch(urlToChek)
    if (response.status !== 200) {
      throw { name: 'Forbidden', message: `Not allowed`, res: response }
    }
    return response.json()
  }

  async search(query, token) {
    const options = token ? {headers: {'Auth-Token': token}} : null
    const url = `${this.METASTORE_API}/metastore/search?${query}`
    let response = await fetch(url, options)
    if (response.status !== 200) {
      // eslint-disable-next-line no-throw-literal
      throw {
        name: 'BadStatusCode',
        message: `Bad response from metastore for ${query}`,
        response
      }
    }
    // Do normalize here for all data packages
    response = await response.json()
    response.results = response.results.map(res => {
      let out = DataHubApi.extendedToLogical(res.datapackage)
      // Do preparation for frontend, e.g., prettify bytes
      out = utils.prepareForFrontend(out)
      if (out.readme) { // Convert readme to plain text and shorten
        out.readmeSnippet = utils.makeSmallReadme(out.readme)
      }
      return out
    })
    return response
  }

  async getEvents(query, token) {
    const options = token ? {headers: {'Auth-Token': token}} : null
    const url = `${this.METASTORE_API}/metastore/search/events?${query}`
    let response = await fetch(url, options)
    if (response.status !== 200) {
      // eslint-disable-next-line no-throw-literal
      throw {
        name: 'BadStatusCode',
        message: `Bad response from metastore for ${query}`,
        response
      }
    }
    return await response.json()
  }

  async authenticate(jwt) {
    const url = `${this.AUTH_API}/auth/check?jwt=${jwt}&next=${this.baseUrl}/success`
    const response = await fetch(url)
    const out = await response.json()
    return out
  }

  async authz(token, service='frontend') {
    const options = token ? {headers: {'Auth-Token': token}} : null
    const res = await fetch(
        `${this.AUTH_API}/auth/authorize?service=${service}`,
        options
    )
    if (res.status !== 200) {
      return null
    }
    return (await res.json()).token
  }

  /**
   * Check status of pipelines on specstore
   *
   * @param 'ownerid' - owner's id
   * @param 'name' - dataset name
   * @param 'appendix' - can be one of 'revision-id', 'latest' or 'successful'
   * @return {Object} - status object
   */
  async specStoreStatus(ownerid, name, appendix) {
    const url = `${this.FLOWMANAGER_API}/source/${ownerid}/${name}/${appendix}`
    const response = await fetch(url)
    if (response.status !== 200) {
      throw response
    }
    const out = await response.json()
    return out
  }

  /**
   * Function for getting a user profile
   *
   * @param 'owner' owner name
   * @return {found: Boolean, profile: {id: '...', join_date: '...'}}
   */
   async getProfile(owner) {
     const url = `${this.AUTH_API}/auth/get_profile?username=${owner}`
     const response = await fetch(url)
     if (response.status !== 200) {
       throw response
     }
     const out = await response.json()
     return out
   }

  /**
   * Function for resolving path
   *
   * @param '<publisher>/<packageName>'
   * @return {userid: '...', packageid: '...'}
   */
  async resolve(path_) {
    const url = `${this.RESOLVER_API}/resolver/resolve?path=${path_}`
    const response = await fetch(url)
    const out = await response.json()
    return out
  }

  /**
   * Converts extended data package to logical
   *
   * @param {Object} extended data package
   * @return {Object} logical data package
   */
  static extendedToLogical(extended) {
    const logical = JSON.parse(JSON.stringify(extended))
    logical.resources = []
    const nonTabularResources = {}
    extended.resources.forEach((resource, idx) => {
      if (resource.datahub && resource.datahub.type === 'source/tabular') {
        logical.resources.push(resource)
      } else if (resource.datahub) {
        const nonTabularTypes = ['source/non-tabular', 'derived/zip', 'derived/sqlite']
        if (nonTabularTypes.includes(resource.datahub.type)) {
          nonTabularResources[idx] = resource
        }
      }
    })

    const newListOfResources = []
    logical.resources.forEach(original => {
      let newResource
      extended.resources.forEach(resource => {
        if (resource.datahub && resource.datahub.derivedFrom) {
          if (resource.datahub.derivedFrom.includes(original.name) && resource.format === 'csv') {
            newResource = JSON.parse(JSON.stringify(resource))
            newResource.name = original.name
            newResource.title = original.title || ''
            newResource.description = original.description || ''
            newResource.alternates = []
            newResource.alternates.push(original)
          } else if (resource.datahub.derivedFrom[0] === original.name) {
            newResource.alternates.push(resource)
          }
        }
      })
      newListOfResources.push(newResource)
    })
    for (let idx in nonTabularResources) {
      newListOfResources.splice(idx, 0, nonTabularResources[idx])
    }
    logical.resources = newListOfResources
    return logical
  }

  /**
   * Converts logical dp to good dp
   *
   * @param {Object} logical datapackage
   * @return {Object} good datapackage
   */
   static makeGoodDp(dp) {
     const good = JSON.parse(JSON.stringify(dp))
     good.downloads = []
     const excelExtensions = ['xls', 'xlsx']
     good.resources.forEach(res => {
       const download = {
         name: res.name,
         format: res.format,
         title: res.title,
         description: res.description,
         modified: res.modified,
         prettyBytes: res.prettyBytes,
         download: res.path,
         otherFormats: []
       }
       if (excelExtensions.includes(res.format)) {
         good.downloads.push(download)
         if (res.alternates) {
           res.alternates.forEach(alt => {
             if (alt.format === 'csv') {
               const download = {
                 name: alt.name,
                 format: alt.format,
                 title: alt.title,
                 description: alt.description,
                 modified: alt.modified,
                 prettyBytes: alt.prettyBytes,
                 download: alt.path,
                 otherFormats: []
               }
               good.downloads.push(download)
             }
           })
         }
       } else {
         if (res.alternates) {
           res.alternates.forEach(alt => {
             if (alt.datahub && alt.datahub.type === 'derived/json') {
               const otherFormat = {
                 name: alt.name,
                 format: alt.format,
                 prettyBytes: alt.prettyBytes,
                 download: alt.path
               }
               download.otherFormats.push(otherFormat)
             }
           })
         }
         good.downloads.push(download)
       }
     })
     return good
   }
}

module.exports.DataHubApi = DataHubApi
