'use strict'
const pathlib = require('path')
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
    this.FILEMANAGER_URL = config.get('FILEMANAGER_URL')
  }

  // Get a datapackage.json including its readme inline (if readme exists)
  async getPackage(ownerid, name, revisionId, token=null) {
    const res = await this.getPackageFile(ownerid, name, 'datapackage.json', revisionId, token)
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
    // Sort resources as originally and put derived ones in the end:
    const originalResources = (await this.specStoreStatus(ownerid, name, revisionId))
      .spec_contents.inputs[0].parameters.descriptor.resources
    for (let i = originalResources.length; i-- > 0;) {
      const item = dp.resources.find(res => res.name === originalResources[i].name)
      const index = dp.resources.indexOf(item)
      if (item) {
        dp.resources.splice(index, 1)
        dp.resources.unshift(item)
      }
    }
    // Making a copy of dp to use in the compiled README
    const initialDp = Object.assign({}, dp)

    dp.path = urllib.resolve(
      this.bitstoreUrl,
      [ownerid, name, revisionId].join('/')
    )

    // We might already have readme set - e.g. if it has already been inlined ...
    if (!dp.readme) {
      const readmeRes = await this.getPackageFile(ownerid, name, 'README.md', revisionId, token)
      // ignore 404s etc
      if (readmeRes.status === 200) {
        dp.readme = await readmeRes.text()
      } else {
        // TODO: debug
        console.log(`README not found for package ${ownerid}/${name}`)
        dp.readme = ''
      }
    }

    const readmeSnippet = utils.makeSmallReadme(dp.readme)
    if (readmeSnippet) {
      dp.readmeSnippet = readmeSnippet
    }
    // TODO: we should use original dp here:
    const readmeCompiled = utils.dpInReadme(dp.readme, initialDp)
    dp.readmeHtml = utils.textToMarkdown(readmeCompiled)
    // Do preparations for frontend, e.g. convert bytes into human-readable
    dp = utils.prepareForFrontend(dp)
    dp = await DataHubApi.makeGoodDp(dp)
    // Handle reports here so each report is in its resource under "report" property:
    if (dp.report) {
      dp = await this.handleReport(dp, {
        ownerid,
        name,
        token
      })
    }
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
      return this.getPackage(pkgId.ownerid, pkgId.name, pkgId.revisionId)
    })).catch(err => {
      console.log(err)
    })
  }

  async getPackageFile(ownerid, name, path = 'datapackage.json', revisionId, token=null) {
    let url = urllib.resolve(
      this.bitstoreUrl,
      [ownerid, name, revisionId, path].join('/')
    )
    let response = await fetch(url)
    if (response.status === 403) {
      if (!token) {
        throw { name: 'Forbidden', message: `Not allowed`, res: response }
      }
      const signedUrl = await this.checkForSignedUrl(url, ownerid, token)
      response = await fetch(signedUrl.url)
    } else if (response.status === 404) { // This is temporary solution for https://github.com/datahq/bitstore/issues/22
      url = urllib.resolve(
        this.bitstoreUrl,
        [ownerid, name, 'latest', path].join('/')
      )
      response = await fetch(url)
    }
    return response
  }

  async checkForSignedUrl(url, ownerid, token, authzToken) {
    if (!authzToken) {
      authzToken = await this.authz(token)
    }
    const urlToCheck = urllib.resolve(
      this.DATAHUB_API,
      `rawstore/presign?jwt=${authzToken}&ownerid=${ownerid}&url=${url}`
    )
    const response = await fetch(urlToCheck)
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

  async getStorage({owner = '', pkgId = '', flowId = '', token, findability}={}) {
    const query = pathlib.join(owner, pkgId, flowId.toString())
    let prefix = ''
    if (owner && pkgId && flowId) {
      prefix = 'flow_id'
    } else if (owner && pkgId) {
      prefix = 'dataset_id'
    } else if (owner) {
      prefix = 'owner'
    }
    let url = `${this.FILEMANAGER_URL}/storage/${prefix}/${query}`
    if (findability) {
      url += `?findability=${findability}`
    }
    const options = token ? {headers: {'Auth-Token': token}} : null
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
    const nonTabularResources = []
    extended.resources.forEach((resource, idx) => {
      if (resource.datahub && resource.datahub.type === 'source/tabular') {
        logical.resources.push(resource)
      } else if (resource.datahub) {
        const nonTabularTypes = ['original', 'source/non-tabular', 'derived/zip', 'derived/sqlite']
        if (nonTabularTypes.includes(resource.datahub.type)) {
          nonTabularResources.push(resource)
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
      if (newResource) {
        newListOfResources.push(newResource)
      } else {
        newListOfResources.push(original)
      }
    })

    logical.resources = newListOfResources.concat(nonTabularResources)
    // Include report resource in the root "report" property of the descriptor:
    logical.report = extended.resources.find(res => (res.datahub && res.datahub.type === 'derived/report'))
    return logical
  }

  /**
   * Converts logical dp to good dp
   *
   * @param {Object} logical datapackage
   * @return {Object} good datapackage
   */
   static async makeGoodDp(dp) {
     let good = JSON.parse(JSON.stringify(dp))
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

   /**
    * Fetchs and allocates reports among resources
    *
    * @param {Object} datapackage that has "report" in the root level
    * @return {Object} datapackage with handled reports
    */
   async handleReport(dp, {ownerid,name,token}={}) {
     // Create "valid" property in the "good.report" object so we know if any of reports is invalid.
     // This allows us to easily show notice on the top of showcase page.
     dp.report.valid = true
     const pathParts = urllib.parse(dp.report.path)
     let response
     let url
     let out
     if (pathParts.protocol) {
       url = dp.report.path
       response = await fetch(dp.report.path)
     } else { // Treat as relative path so construct a url
       url = urllib.resolve(
         this.bitstoreUrl,
         [ownerid, name, dp.report.name, dp.report.path].join('/')
       )
       response = await fetch(url)
     }

     if (response.status === 200) {
       out = await response.json()
     } else if (response.status === 403) {
       if (!token) {
         throw { name: 'Forbidden', message: `Not allowed`, res: response }
       }
       const signedUrl = await this.checkForSignedUrl(url, ownerid, token)
       response = await fetch(signedUrl.url)
       out = await response.json()
     }
     out.forEach(report => {
       const resourceForThisReport = dp.resources.find(res => {
         // In case of xls or xslx additional resource is added with suffix '-sheet-1' By CLI
         // That resource is not included in original descriptor as should be added later when processed
         // While validation is performed on resource with `sheet-1` we can not find match
         // So as the temporary solution we are hardcoding it right now.
         return res.name === report.resource || res.name+'-sheet-1' === report.resource
       })
       if (resourceForThisReport) {
         resourceForThisReport.report = JSON.stringify(report).replace(/\\"/g, "").replace(/\"/g, "\\\"")
         resourceForThisReport.reportObj = report
       }
       // Set "valid" property for entire dataset - false if any of reports is invalid:
       if (!report.valid) {
         dp.report.valid = false
       }
     })

     return dp
   }
}

module.exports.DataHubApi = DataHubApi
