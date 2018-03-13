'use strict'

const fs = require('fs')
const path = require('path')
const urllib = require('url')

const express = require('express')
const ab = require('express-ab')
const fetch = require('node-fetch')
const bytes = require('bytes')
const fm = require('front-matter')
const moment = require('moment')
const md5 = require('md5')
const timeago = require('timeago.js')

const config = require('../config')
const lib = require('../lib')
const utils = require('../lib/utils')

let frontPageTest = ab.test('front-page-layout', { id: '0atclDGyTXmkeIj1_WlXAg' })

module.exports = function () {
  // eslint-disable-next-line new-cap
  const router = express.Router()
  const api = new lib.DataHubApi(config)

  // Here we have 2 settings for `/` route as we're doing A/B testing:
  router.get('/', frontPageTest(), async (req, res) => {
    // Get showcase and turorial packages for the front page
    let listOfShowcasePkgId = config.get('showcasePackages')
    let listOfTutorialPkgId = config.get('tutorialPackages')
    listOfShowcasePkgId = await Promise.all(listOfShowcasePkgId.map(async pkgId => {
      const status = await api.specStoreStatus(pkgId.ownerid, pkgId.name, 'successful')
      pkgId.revisionId = status.id.split('/')[2] // Id is in `userid/dataset/id` form so we need the latest part
      return pkgId
    }))
    listOfTutorialPkgId = await Promise.all(listOfTutorialPkgId.map(async pkgId => {
      const status = await api.specStoreStatus(pkgId.ownerid, pkgId.name, 'successful')
      pkgId.revisionId = status.id.split('/')[2] // Id is in `userid/dataset/id` form so we need the latest part
      return pkgId
    }))
    const showcasePackages = await api.getPackages(listOfShowcasePkgId)
    const tutorialPackages = await api.getPackages(listOfTutorialPkgId)
    res.render('home.html', {
      title: 'Home',
      showcasePackages,
      tutorialPackages,
      expId: res.locals.ab.id,
      expVar: res.locals.ab.variantId
    })
  })

  router.get('/', frontPageTest(), async (req, res) => {
    // Get showcase and turorial packages for the front page
    let listOfShowcasePkgId = config.get('showcasePackages')
    listOfShowcasePkgId = await Promise.all(listOfShowcasePkgId.map(async pkgId => {
      const status = await api.specStoreStatus(pkgId.ownerid, pkgId.name, 'successful')
      pkgId.revisionId = status.id.split('/')[2] // Id is in `userid/dataset/id` form so we need the latest part
      return pkgId
    }))
    const showcasePackages = await api.getPackages(listOfShowcasePkgId)
    res.render('home_new.html', {
      title: 'Home',
      showcasePackages,
      expId: res.locals.ab.id,
      expVar: res.locals.ab.variantId
    })
  })

  // ----------------------------
  // Redirects from old datahub.io to new website

  function redirectToDest(dest) {
    return (req, res) => {
      res.redirect(302, dest)
    }
  }

  // Following paths to be redirected to new "/search" page
  router.get([
    '/dataset',
    '/dataset?res_format=CSV',
    '/es/dataset', '/it/dataset', '/fr/dataset', '/zh_CN/dataset'
  ], redirectToDest('/search'))

  // These should be redirected to new "/core" page
  router.get([
    '/organization/core',
    '/dataset/core'
  ], redirectToDest('/core'))

  // Following variations of "iso-3166-1-alpha-2-country-codes" dataset should
  // be redirected to new "country-list" dataset.
  // There are number of variations due to language/country versions.
  router.get([
    '/dataset/iso-3166-1-alpha-2-country-codes',
    '/dataset/iso-3166-1-alpha-2-country-codes/*',
    '/*/dataset/iso-3166-1-alpha-2-country-codes',
    '/*/dataset/iso-3166-1-alpha-2-country-codes/*'
  ], redirectToDest('/core/country-list'))

  // All requests related to "us-employment-bls" redirect to new "employment-us"
  router.get([
    '/dataset/us-employment-bls',
    '/dataset/us-employment-bls/*',
    '/*/dataset/us-employment-bls',
    '/*/dataset/us-employment-bls/*'
  ], redirectToDest('/core/employment-us'))

  // All requests related to "iso-4217-currency-codes" redirect
  // to new "currency-codes" dataset
  router.get([
    '/dataset/iso-4217-currency-codes',
    '/dataset/iso-4217-currency-codes/*',
    '/*/dataset/iso-4217-currency-codes',
    '/*/dataset/iso-4217-currency-codes/*'
  ], redirectToDest('/core/currency-codes'))

  // "standard-and-poors-500-shiller" => "s-and-p-500" under core
  router.get([
    '/dataset/standard-and-poors-500-shiller',
    '/dataset/standard-and-poors-500-shiller/*',
    '/*/dataset/standard-and-poors-500-shiller',
    '/*/dataset/standard-and-poors-500-shiller/*'
  ], redirectToDest('/core/s-and-p-500'))

  // "cofog" => "cofog" under core
  router.get([
    '/dataset/cofog',
    '/dataset/cofog/*',
    '/*/dataset/cofog',
    '/*/dataset/cofog/*'
  ], redirectToDest('/core/cofog'))

  // same here
  router.get([
    '/dataset/gold-prices',
    '/dataset/gold-prices/*',
    '/*/dataset/gold-prices',
    '/*/dataset/gold-prices/*'
  ], redirectToDest('/core/gold-prices'))

  // and here also
  router.get([
    '/dataset/imf-weo',
    '/dataset/imf-weo/*',
    '/*/dataset/imf-weo',
    '/*/dataset/imf-weo/*'
  ], redirectToDest('/core/imf-weo'))

  // Finally, redirections for login and dashboard pages
  router.get('/user/login', redirectToDest('/login'))
  router.get(['/dashboard/datasets', '/dashboard/groups'], redirectToDest('/dashboard'))

  // ----------------------------
  // Redirects for old.datahub.io
  //
  // come first to avoid any risk of conflict with /:owner or /:owner/:dataset

  function redirect(path, base='https://old.datahub.io') {
    return (req, res) => {
      let dest = base + path;
      if (req.params[0] && Object.keys(req.query).length > 0) {
        let queryString = '?' + req.url.split('?')[1]
        dest += '/' + req.params[0] + queryString
      } else if (req.params[0]) {
        dest += '/' + req.params[0]
      }
      res.redirect(302, dest);
    }
  }
  const redirectPaths = [
    '/organization',
    '/api',
    '/dataset',
    '/user',
    '/tag'
  ]
  for(let offset of redirectPaths) {
    router.get([offset, offset+'/*'], redirect(offset))
  }

  // /end redirects
  // -------------

  router.get('/dashboard', async (req, res, next) => {
    if (req.cookies.jwt) {
      const isAuthenticated = await api.authenticate(req.cookies.jwt)
      if (isAuthenticated) {
        const events = await api.getEvents(`owner="${req.cookies.username}"&size=10`, req.cookies.jwt)
        events.results = events.results.map(item => {
          item.timeago = timeago().format(item.timestamp)
          return item
        })
        const packages = await api.search(`datahub.ownerid="${req.cookies.id}"&size=0`, req.cookies.jwt)
        const currentUser = utils.getCurrentUser(req.cookies)

        let storage, storagePublic, storagePrivate
        try {
          storage = await api.getStorage({owner: req.cookies.username})
          storagePrivate = await api.getStorage({owner: req.cookies.username, findability: 'private'})
          storagePublic = storage.totalBytes - storagePrivate.totalBytes
        } catch (err) {
          // Log the error but continue loading the page without storage info
          console.error(err)
        }

        res.render('dashboard.html', {
          title: 'Dashboard',
          currentUser,
          events: events.results,
          totalPackages: packages.summary.total,
          publicSpaceUsage: storagePublic ? bytes(storagePublic, {decimalPlaces: 0}) : 'N/A',
          privateSpaceUsage: storagePrivate ? bytes(storagePrivate.totalBytes, {decimalPlaces: 0}) : 'N/A'
        })
      } else {
        req.flash('message', 'Your token has expired. Please, login to see your dashboard.')
        res.redirect('/')
      }
    } else {
      res.status(404).render('404.html', {message: 'Sorry, this page was not found'})
      return
    }
  })

  router.get('/login', async (req, res) => {
    const providers = await api.authenticate()
    const githubLoginUrl = providers.providers.github.url
    res.render('login.html', {
      githubLoginUrl
    })
  })

  router.get('/success', async (req, res) => {
    const jwt = req.query.jwt
    const isAuthenticated = await api.authenticate(jwt)
    if (isAuthenticated.authenticated) {
      res.cookie('jwt', jwt)
      res.cookie('email', isAuthenticated.profile.email)
      res.cookie('id', isAuthenticated.profile.id)
      res.cookie('username', isAuthenticated.profile.username)
      res.redirect('/dashboard')
    } else {
      req.flash('message', 'Something went wrong. Please, try again later.')
      res.redirect('/')
    }
  })

  router.get('/logout', async (req, res) => {
    res.clearCookie('jwt')
    req.flash('message', 'You have been successfully logged out.')
    res.redirect('/')
  })

  // ==============
  // Docs (patterns, standards etc)

  async function showDoc (req, res) {
    if (req.params[0]) {
      const page = req.params[0]
      const BASE = 'https://raw.githubusercontent.com/datahq/content/master/'
      const filePath = 'docs/' + page + '.md'
      const gitpath = BASE + filePath
      const resp = await fetch(gitpath)
      const text = await resp.text()
      const parsedWithFM = fm(text)
      const content = utils.md.render(parsedWithFM.body)
      const date = parsedWithFM.attributes.date
        ? moment(parsedWithFM.attributes.date).format('MMMM Do, YYYY')
        : null
      const githubPath = '//github.com/okfn/data.okfn.org/blob/master/' + path
      res.render('docs.html', {
        title: parsedWithFM.attributes.title,
        date,
        content,
        githubPath
      })
    } else {
      res.render('docs_home.html', {
        title: 'Documentation'
      })
    }
  }

  router.get(['/docs', '/docs/*'], showDoc)

  // ===== /end docs

  /** Awesome pages. http://datahub.io/awesome
   * For this section we will parse, render and
   * return pages from the awesome github repo:
   * https://github.com/datahubio/awesome
   */
  router.get('/awesome', showAwesomePage)
  router.get('/awesome/:page', showAwesomePage)

  async function showAwesomePage(req, res) {
    const BASE = 'https://raw.githubusercontent.com/datahubio/awesome-data/master/'
    const path = req.params.page ? req.params.page + '.md' : 'README.md'
    //request raw page from github
    let gitpath = BASE + path
    let editpath = 'https://github.com/datahubio/awesome-data/edit/master/' + path
    const resp = await fetch(gitpath)
    const text = await resp.text()
    // parse the raw .md page and render it with a template.
    const parsedWithFrontMatter = fm(text)
    res.render('awesome.html', {
      title: parsedWithFrontMatter.attributes.title,
      page: req.params.page,
      editpath: editpath,
      description: parsedWithFrontMatter.attributes.description,
      content: utils.md.render(parsedWithFrontMatter.body)
    })
  }
  /* end awesome  */


  // ==============
  // Blog
  router.get('/blog', (req, res) => {
    const listOfPosts = []
    fs.readdirSync('blog/').forEach(post => {
      const filePath = `blog/${post}`
      const text = fs.readFileSync(filePath, 'utf8')
      let parsedWithFM = fm(text)
      parsedWithFM.body = utils.md.render(parsedWithFM.body)
      parsedWithFM.attributes.date = moment(parsedWithFM.attributes.date).format('MMMM Do, YYYY')
      parsedWithFM.attributes.authors = parsedWithFM.attributes.authors.map(author => authors[author])
      parsedWithFM.path = `blog/${post.slice(11, -3)}`
      listOfPosts.unshift(parsedWithFM)
    })
    res.render('blog.html', {
      title: 'Home',
      posts: listOfPosts
    })
  })

  router.get('/blog/:post', showPost)

  function showPost(req, res) {
    const page = req.params.post
    const fileName = fs.readdirSync('blog/').find(post => {
      return post.slice(11, -3) === page
    })
    if (fileName) {
      const filePath = `blog/${fileName}`
      fs.readFile(filePath, 'utf8', function(err, text) {
        if (err) throw err
        const parsedWithFM = fm(text)
        res.render('post.html', {
          title: parsedWithFM.attributes.title,
          date: moment(parsedWithFM.attributes.date).format('MMMM Do, YYYY'),
          authors: parsedWithFM.attributes.authors.map(author => authors[author]),
          content: utils.md.render(parsedWithFM.body)
        })
      })
    } else {
      res.status(404).render('404.html', {message: 'Sorry no post was found'})
      return
    }
  }
  const authors = {
    'rufuspollock': {name: 'Rufus Pollock', gravatar: md5('rufus.pollock@datopian.com'), username: 'rufuspollock'},
    'anuveyatsu': {name: 'Anuar Ustayev', gravatar: md5('anuar.ustayev@gmail.com'), username: 'anuveyatsu'},
    'zelima': {name: 'Irakli Mchedlishvili', gravatar: md5('irakli.mchedlishvili@datopian.com'), username: 'zelima1'},
    'mikanebu': {name: 'Meiran Zhiyenbayev', gravatar: md5('meiran1991@gmail.com'), username: 'Mikanebu'},
    'akariv': {name: 'Adam Kariv', gravatar: md5('adam.kariv@gmail.com'), username: 'akariv'},
    'acckiygerman': {name: 'Dima German', gravatar: md5('dmitry.german@datopian.com'), username: 'acckiygerman'}
  }
  // ===== /end blog

  // Function for rendering showcase page:
  function renderShowcase(revision) {
    return async (req, res, next) => {
      let token = req.cookies.jwt ? req.cookies.jwt : req.query.jwt
      // Hit the resolver to get userid and packageid:
      const userAndPkgId = await api.resolve(path.join(req.params.owner, req.params.name))
      // If specStoreStatus API does not respond within 10 sec,
      // then proceed to error handler and show 500:
      const timeoutObj = setTimeout(() => {
        next('status api timed out')
        return
      }, 10000)

      // Get the latest successful revision, if does not exist show 404
      let revisionStatus
      try {
        revisionStatus = await api.specStoreStatus(
          userAndPkgId.userid,
          userAndPkgId.packageid,
          revision ? revision : req.params.revisionId
        )
        clearTimeout(timeoutObj)
      } catch (err) {
        next(err)
        return
      }

      // Get the "normalizedDp" depending on revision status:
      let normalizedDp = null
      let failedPipelines = []
      // Id is in `userid/dataset/id` form so we need the latest part:
      const revisionId = revisionStatus.id.split('/')[2]

      if (revisionStatus.state === 'SUCCEEDED') { // Get it normally
        try {
          normalizedDp = await api.getPackage(userAndPkgId.userid, userAndPkgId.packageid, revisionId, token)
        } catch (err) {
          next(err)
          return
        }
      } else {
        if (revisionStatus.state === 'FAILED') { // Use original dp and collect failed pipelines
          normalizedDp = revisionStatus.spec_contents.inputs[0].parameters.descriptor
          for (let key in revisionStatus.pipelines) {
            if (revisionStatus.pipelines[key].status === 'FAILED') {
              failedPipelines.push(revisionStatus.pipelines[key])
            } else if (revisionStatus.pipelines[key].status === 'SUCCEEDED' && key.includes('validation_report')) {
              // As "validation_report" pipeline SUCCEEDED, we can get reports:
              let report = await fetch(revisionStatus.pipelines[key].stats['.dpp']['out-datapackage-url'])
              if (report.status === 403) {
                try {
                  const signedUrl = await api.checkForSignedUrl(
                    revisionStatus.pipelines[key].stats['.dpp']['out-datapackage-url'],
                    userAndPkgId.userid,
                    token
                  )
                  let res = await fetch(signedUrl.url)
                  report = await res.json()
                } catch (err) {
                  next(err)
                  return
                }
              } else if (report.status === 200) {
                report = await report.json()
              }
              normalizedDp.report = report.resources[0]
              normalizedDp = await api.handleReport(normalizedDp, {
                ownerid: userAndPkgId.userid,
                name: userAndPkgId.packageid,
                token
              })
            }
          }
        } else if (['INPROGRESS', 'QUEUED'].includes(revisionStatus.state)) {
          // We don't want to show showcase page from original dp if dataset is
          // private. If so compare userid with hash of user email from cookies:
          // Also compare userid with owner (in case of custom ID Eg core)
          // TODO: we should probably have API for it.
          const emailHash = req.cookies.email ? md5(req.cookies.email) : ''
          if (userAndPkgId.userid !== emailHash && userAndPkgId.userid !== req.params.owner) {
            res.status(404).render('404.html', {
              message: 'Sorry, this page was not found',
              comment: 'You might need to Login to access more datasets'
            })
            return
          }
          // Only if above stuff is passed we use original dp:
          normalizedDp = revisionStatus.spec_contents.inputs[0].parameters.descriptor
        }

        // When we use original dp.json, "path" for a "resource" can be relative
        // but to be able to render views using that "resource" we need full URL
        // of it. We can access full URLs from "resource-mapping" property in the
        // source API's spec_contents and replace relative paths with it:
        normalizedDp.resources.forEach(resource => {
          const pathParts = urllib.parse(resource.path)
          if (!pathParts.protocol) {
            const remotePath = revisionStatus.spec_contents.inputs[0].parameters['resource-mapping'][resource.path]
            resource.path = remotePath || resource.path
          }
        })
        // Since "frontend-showcase-js" library renders views according to
        // descriptor's "views" property, we need to include "preview" views:
        // (in the SUCCEEDED revisions "preview" views are generated)
        normalizedDp.views = normalizedDp.views || []
        normalizedDp.resources.forEach(resource => {
          const view = {
            datahub: {
              type: 'preview'
            },
            resources: [
               resource.name
            ],
            specType: 'table'
          }
          normalizedDp.views.push(view)
        })

        // When we use original dp.json, we only have "readme" property. In the
        // showcase page we use "readmeSnippet" property to display short readme
        // in the top of the page and "readmeHtml" property to render full readme:
        if (normalizedDp.readme) {
          normalizedDp.readmeSnippet = utils.makeSmallReadme(normalizedDp.readme)
          const readmeCompiled = utils.dpInReadme(normalizedDp.readme, normalizedDp)
          normalizedDp.readmeHtml = utils.textToMarkdown(readmeCompiled)
        }
      }

      renderPage(revisionStatus)

      async function renderPage(status) {
        // Check if it's a private dataset and sign urls if so:
        if (status.spec_contents.meta.findability === 'private') {
          const authzToken = await api.authz(token)
          await Promise.all(normalizedDp.resources.map(async resource => {
            const pathParts = urllib.parse(resource.path)
            if (!pathParts.protocol) {
              resource.path = urllib.resolve(
                config.get('BITSTORE_URL'),
                [userAndPkgId.userid, userAndPkgId.packageid, resource.name, resource.path].join('/')
              )
            }
            let response = await fetch(resource.path)
            if (response.status === 403) {
              const signedUrl = await api.checkForSignedUrl(
                resource.path,
                userAndPkgId.userid,
                null,
                authzToken
              )
              resource.path = signedUrl.url
            }
            if (resource.alternates) {
              const previewResource = resource.alternates.find(res => res.datahub.type === 'derived/preview')
              if (previewResource) {
                const pathParts = urllib.parse(previewResource.path)
                if (!pathParts.protocol) {
                  previewResource.path = urllib.resolve(
                    config.get('BITSTORE_URL'),
                    [userAndPkgId.userid, userAndPkgId.packageid, previewResource.name, previewResource.path].join('/')
                  )
                }
                let response = await fetch(previewResource.path)
                if (response.status === 403) {
                  const signedUrl = await api.checkForSignedUrl(
                    previewResource.path,
                    userAndPkgId.userid,
                    null,
                    authzToken
                  )
                  previewResource.path = signedUrl.url
                }
              }
            }
          }))
        }

        // Get size of this revision:
        const [owner, name, revision] = status.id.split('/')
        let storage
        try {
          storage = await api.getStorage({owner, pkgId: name, flowId: revision})
        } catch (err) {
          // Log the error but continue loading the page without storage info
          console.error(err)
        }

        // Now render the page:
        res.render('showcase.html', {
          title: req.params.owner + ' | ' + req.params.name,
          dataset: normalizedDp,
          owner: req.params.owner,
          size: storage ? bytes(storage.totalBytes, {decimalPlaces: 0}) : 'N/A',
          // eslint-disable-next-line no-useless-escape, quotes
          dpId: JSON.stringify(normalizedDp).replace(/\\/g, '\\\\').replace(/\'/g, "\\'"),
          status: status.state,
          failUrl: `/${req.params.owner}/${req.params.name}/v/${revisionId}`,
          successUrl: `/${req.params.owner}/${req.params.name}`,
          statusApi: `${config.get('API_URL')}/source/${userAndPkgId.userid}/${userAndPkgId.packageid}/${revisionId}`,
          failedPipelines
        })
      }
    }
  }

  router.get('/:owner/:name', renderShowcase('successful'))
  router.get('/:owner/:name/v/:revisionId', renderShowcase())

  router.get('/:owner/:name/datapackage.json', async (req, res, next) => {
    let normalizedDp = null
    let token = req.cookies.jwt ? req.cookies.jwt : req.query.jwt
    const userAndPkgId = await api.resolve(path.join(req.params.owner, req.params.name))
    if (!userAndPkgId.userid) {
      res.status(404).render('404.html', {
        message: 'Sorry, this page was not found',
        comment: 'You might need to Login to access more datasets'
      })
      return
    }

    // Get the latest successful revision, if does not exist show 404
    let latestSuccessfulRevision
    try {
      latestSuccessfulRevision = await api.specStoreStatus(
        userAndPkgId.userid,
        userAndPkgId.packageid,
        'successful'
      )
    } catch (err) {
      next(err)
      return
    }

    const revisionId = latestSuccessfulRevision.id.split('/')[2]
    try {
      normalizedDp = await api.getPackage(userAndPkgId.userid, userAndPkgId.packageid, revisionId, token)
    } catch (err) {
      next(err)
      return
    }
    let redirectUrl = `${normalizedDp.path}/datapackage.json`
    let resp = await fetch(redirectUrl)
    // After changes in pkgstore, we ended up with some datasets that cannot be
    // accessed by its revision id unless its revision re-triggered. In such
    // cases we can access datapackage.json by using 'latest' string instead of
    // revision id:
    if (resp.status === 404) {
      redirectUrl = redirectUrl.replace(`/${revisionId}/`, '/latest/')
    }
    if (normalizedDp.datahub.findability === 'private') {
      const authzToken = await api.authz(token)
      if (resp.status === 403) {
        const signedUrl = await api.checkForSignedUrl(
          redirectUrl, userAndPkgId.userid, null, authzToken
        )
        redirectUrl = signedUrl.url
      }
    }
    res.redirect(redirectUrl)
  })

  router.get('/:owner/:name/r/:fileNameOrIndex', async (req, res, next) => {
    let normalizedDp = null
    let token = req.cookies.jwt ? req.cookies.jwt : req.query.jwt
    const userAndPkgId = await api.resolve(path.join(req.params.owner, req.params.name))
    if (!userAndPkgId.userid) {
      res.status(404).render('404.html', {
        message: 'Sorry, this page was not found',
        comment: 'You might need to Login to access more datasets'
      })
      return
    }
    // Get the latest successful revision, if does not exist show 404
    let latestSuccessfulRevision
    try {
      latestSuccessfulRevision = await api.specStoreStatus(
        userAndPkgId.userid,
        userAndPkgId.packageid,
        'successful'
      )
    } catch (err) {
      next(err)
      return
    }
    try {
      const revisionId = latestSuccessfulRevision.id.split('/')[2]
      normalizedDp = await api.getPackage(userAndPkgId.userid, userAndPkgId.packageid, revisionId, token)
    } catch (err) {
      next(err)
      return
    }

    const fileParts = path.parse(req.params.fileNameOrIndex)
    const extension = fileParts.ext
    const name = fileParts.name

    let resource
    // Check if file name is a number (check if zero explicitely as 0 evaluates to false in JS)
    if (parseInt(name, 10) || parseInt(name, 10) === 0) {
      // If number it still can be a file name not index so check it
      resource = normalizedDp.resources.find(res => res.name === name)
      // Otherwise get resource by index
      if (!resource) {
        resource = normalizedDp.resources[parseInt(name, 10)]
      }
    } else {
      // If name is not a number then just find resource by name
      resource = normalizedDp.resources.find(res => res.name === name)
    }
    // Check if resource was found and give 404 if not
    if (!resource) {
      res.status(404).render('404.html', {
        message: 'Sorry, we cannot locate that file for you'
      })
    }

    // If resource is tabular or geojson + requested extension is HTML,
    // then render embeddable HTML table or map:
    const isTabular = resource.datahub && resource.datahub.type === 'derived/csv'
    if ((isTabular || resource.format === 'geojson') && extension.substring(1) === 'html') {
      // Prepare minified dp.json with the required resource:
      normalizedDp.resources = [resource]
      normalizedDp.views = []
      if (isTabular) { // For tabular resource we need to prepare 'preview' view:
        const preview = {
          "datahub": {
            "type": "preview"
          },
          "resources": [
            resource.name
          ],
          "specType": "table"
        }
        normalizedDp.views.push(preview)
      }
      // Handle private resources:
      if (normalizedDp.datahub.findability === 'private') {
        const authzToken = await api.authz(token)
        if (resource.alternates) {
          const previewResource = resource.alternates.find(res => res.datahub.type === 'derived/preview')
          if (previewResource) {
            previewResource.path = await getSignedUrl(previewResource.path)
          } else {
            resource.path = await getSignedUrl(resource.path)
          }
        } else {
          resource.path = await getSignedUrl(resource.path)
        }
      }
      // Render the page with stripped dp:
      res.render('view.html', {
        title: req.params.name,
        // eslint-disable-next-line no-useless-escape, quotes
        dpId: JSON.stringify(normalizedDp).replace(/\\/g, '\\\\').replace(/\'/g, "\\'")
      })
      return
    }

    // If resource was found then identify required format by given extension
    if (!(resource.format === extension.substring(1))) {
      if (resource.alternates) {
        resource = resource.alternates.find(res => (extension.substring(1) === res.format && res.datahub.type !== 'derived/preview'))
      }
      // If given format was not found then show 404
      if (!resource) {
        res.status(404).render('404.html', {
          message: 'Sorry, we cannot locate that file for you'
        })
      }
    }

    async function getSignedUrl(path) {
      const authzToken = await api.authz(token)
      let resp = await fetch(path)
      if (resp.status === 403) {
        const signedUrl = await api.checkForSignedUrl(
          path, userAndPkgId.userid, null, authzToken
        )
        return signedUrl.url
      }
    }

    // If dataset's findability is private then get a signed url for the resource
    let finalPath = resource.path
    if (normalizedDp.datahub.findability === 'private') {
      finalPath = await getSignedUrl(finalPath)
    }

    res.redirect(finalPath)
  })

  // Per view URL:
  router.get('/:owner/:name/view/:viewNameOrIndex', async (req, res, next) => {
    let normalizedDp = null
    let token = req.cookies.jwt ? req.cookies.jwt : req.query.jwt
    const userAndPkgId = await api.resolve(path.join(req.params.owner, req.params.name))
    if (!userAndPkgId.userid) {
      res.status(404).render('404.html', {
        message: 'Sorry, this page was not found',
        comment: 'You might need to Login to access more datasets'
      })
      return
    }
    // Get the latest successful revision, if does not exist show 404
    let latestSuccessfulRevision
    try {
      latestSuccessfulRevision = await api.specStoreStatus(
        userAndPkgId.userid,
        userAndPkgId.packageid,
        'successful'
      )
    } catch (err) {
      next(err)
      return
    }
    try {
      const revisionId = latestSuccessfulRevision.id.split('/')[2]
      normalizedDp = await api.getPackage(userAndPkgId.userid, userAndPkgId.packageid, revisionId, token)
    } catch (err) {
      next(err)
      return
    }

    // First try to find a view by name, e.g., if a number is given but view name is a number:
    // We're using "==" here as we want string '1' to be equal to number 1:
    let view = normalizedDp.views.find(item => item.name == req.params.viewNameOrIndex)
    // 'view' wasn't found, now get a view by index:
    view = view || normalizedDp.views[req.params.viewNameOrIndex]
    if (!view) { // 'view' wasn't found - return 404
      res.status(404).render('404.html', {
        message: 'Sorry, this page was not found'
      })
      return
    }
    // Replace original 'views' property with a single required 'view':
    normalizedDp.views = [view]

    if (view.resources) { // 'view' has 'resources' property then find required resources:
      const newResources = []
      view.resources.forEach(res => {
        if (res.constructor.name === 'Object') { // It's Object so use its 'name' property:
          res = res.name
        }
        let resource = normalizedDp.resources.find(item => item.name == res)
        resource = resource || normalizedDp.resources[res]
        newResources.push(resource)
      })
      // Replace original 'resources' property with a new list that is needed for the 'view':
      normalizedDp.resources = newResources
    } else { // Use only the first resource as by default:
      normalizedDp.resources = [normalizedDp.resources[0]]
    }

    // Handle private resources:
    if (normalizedDp.datahub.findability === 'private') {
      await Promise.all(normalizedDp.resources.map(async res => {
        let response = await fetch(res.path)
        if (response.status === 403) {
          const signedUrl = await api.checkForSignedUrl(
            res.path,
            userAndPkgId.userid,
            token
          )
          res.path = signedUrl.url
        }
      }))
    }

    // Render the page with stripped dp:
    res.render('view.html', {
      title: req.params.name,
      // eslint-disable-next-line no-useless-escape, quotes
      dpId: JSON.stringify(normalizedDp).replace(/\\/g, '\\\\').replace(/\'/g, "\\'")
    })
  })

  router.get('/:owner/:name/events', async (req, res, next) => {
    // First check if dataset exists
    const token = req.cookies.jwt
    const userAndPkgId = await api.resolve(path.join(req.params.owner, req.params.name))
    // Get the latest successful revision, if does not exist show 404
    let latestSuccessfulRevision
    try {
      latestSuccessfulRevision = await api.specStoreStatus(
        userAndPkgId.userid,
        userAndPkgId.packageid,
        'successful'
      )
    } catch (err) {
      next(err)
      return
    }
    const revisionId = latestSuccessfulRevision.id.split('/')[2]
    const response = await api.getPackageFile(userAndPkgId.userid, req.params.name, undefined, revisionId, token)
    if (response.status === 200) {
      const events = await api.getEvents(`owner="${req.params.owner}"&dataset="${req.params.name}"`, req.cookies.jwt)
      events.results = events.results.map(item => {
        item.timeago = timeago().format(item.timestamp)
        return item
      })
      res.render('events.html', {
        events: events.results,
        username: req.params.owner,
        dataset: req.params.name
      })
    } else if (response.status === 404) {
      res.status(404).render('404.html', {
        message: 'Sorry, this page was not found'
      })
    } else {
      next(response)
    }
  })

  router.get('/search', async (req, res) => {
    const token = req.cookies.jwt
    const from = req.query.from || 0
    const size = req.query.size || 20
    let query
    if (req.query.q) {
      query = `q="${req.query.q}"&size=${size}&from=${from}`
    } else {
      query = `size=${size}&from=${from}`
    }
    const packages = await api.search(`${query}`, token)
    const total = packages.summary.total
    const totalPages = Math.ceil(total/size)
    const currentPage = parseInt(from, 10) / 20 + 1
    const pages = utils.pagination(currentPage, totalPages)

    res.render('search.html', {
      packages,
      pages,
      currentPage,
      query: req.query.q
    })
  })

  router.get('/pricing', (req, res) => {
    res.render('pricing.html', {
    })
  })

  router.get('/requests', (req, res) => {
    res.render('requests.html', {
    })
  })

  // Download page
  router.get('/download', async (req, res) => {
    let desktopAppUrl, binReleaseMacos, binReleaseLinux, binReleaseWindows, etagForDesktop, etagForBinary

    if (req.app.locals.github) {
      etagForDesktop = req.app.locals.github.releases.desktop
        ? req.app.locals.github.releases.desktop.etag : ''
      etagForBinary = req.app.locals.github.releases.binary
        ? req.app.locals.github.releases.binary.etag : ''
    } else {
      req.app.locals.github = {releases: {}}
    }

    const desktopReleaseModified = await fetch('https://api.github.com/repos/datahq/data-desktop/releases/latest', {
      method: 'GET',
      headers: {'If-None-Match': etagForDesktop}
    })
    const binaryReleaseModified = await fetch('https://api.github.com/repos/datahq/data-cli/releases/latest', {
      method: 'GET',
      headers: {'If-None-Match': etagForBinary}
    })

    if (desktopReleaseModified.status === 304) { // No new release
      desktopAppUrl = req.app.locals.github.releases.desktop.url
    } else { // Go and get new release
      let desktopRelease = await fetch('https://api.github.com/repos/datahq/data-desktop/releases/latest')
      if (desktopRelease.status === 200) {
        const etag = desktopRelease.headers.get('ETag').slice(2)
        // Now get URL for downloading dekstop app:
        desktopRelease = await desktopRelease.json()
        desktopAppUrl = desktopRelease.assets
          .find(asset => path.parse(asset.name).ext === '.dmg')
          .browser_download_url
        // Update desktop release in the app.locals:
        const newRelease = {
          desktop: {
            etag,
            url: desktopAppUrl
          }
        }
        req.app.locals.github.releases = Object.assign(
          req.app.locals.github.releases,
          newRelease
        )
      } else { // If github api is unavailable then just have a link to releases page
        desktopAppUrl = 'https://github.com/datahq/data-desktop/releases'
      }
    }

    if (binaryReleaseModified.status === 304) { // No new release
      binReleaseMacos = req.app.locals.github.releases.binary.macos
      binReleaseLinux = req.app.locals.github.releases.binary.linux
      binReleaseWindows = req.app.locals.github.releases.binary.windows
    } else { // Go and get new release
      let binRelease = await fetch('https://api.github.com/repos/datahq/data-cli/releases/latest')
      if (binRelease.status === 200) {
        const etag = binRelease.headers.get('ETag').slice(2)
        // Now get URLs for downloading binaries:
        binRelease = await binRelease.json()
        binReleaseMacos = binRelease.assets
          .find(asset => asset.name.includes('macos.gz'))
          .browser_download_url
        binReleaseLinux = binRelease.assets
          .find(asset => asset.name.includes('linux.gz'))
          .browser_download_url
        binReleaseWindows = binRelease.assets
          .find(asset => asset.name.includes('win.exe.gz'))
          .browser_download_url
        // Update binary release in the app.locals:
        const newRelease = {
          binary: {
            etag,
            macos: binReleaseMacos,
            linux: binReleaseLinux,
            windows: binReleaseWindows
          }
        }
        req.app.locals.github.releases = Object.assign(
          req.app.locals.github.releases,
          newRelease
        )
      } else { // If github api is unavailable then just have a link to releases page
        binReleaseMacos = 'https://github.com/datahq/datahub-cli/releases'
        binReleaseLinux = 'https://github.com/datahq/datahub-cli/releases'
        binReleaseWindows = 'https://github.com/datahq/datahub-cli/releases'
      }
    }

    res.render('download.html', {
      title: 'Download',
      desktopAppUrl,
      binReleaseMacos,
      binReleaseLinux,
      binReleaseWindows
    })
  })

  // MUST come last in order to catch all the publisher pages
  router.get('/:owner', async (req, res) => {
    // First check if user exists using resolver
    const userProfile = await api.getProfile(req.params.owner)
    if (!userProfile.found) {
      res.status(404).render('404.html', {
        message: 'Sorry, this page was not found'
      })
      return
    }

    const token = req.cookies.jwt
    // Get the latest available 10 events:
    const events = await api.getEvents(`owner="${req.params.owner}"&size=10`, token)
    events.results = events.results.map(item => {
      item.timeago = timeago().format(item.timestamp)
      return item
    })
    // Fetch information about the publisher:
    const joinDate = new Date(userProfile.profile.join_date)
    const joinYear = joinDate.getUTCFullYear()
    const joinMonth = joinDate.toLocaleString('en-us', { month: "long" })
    // Pagination - show 20 items per page:
    const from = req.query.from || 0
    const size = req.query.size || 20
    const packages = await api.search(`datahub.ownerid="${userProfile.profile.id}"&size=${size}&from=${from}`, token)
    const total = packages.summary.total
    const totalPages = Math.ceil(total/size)
    const currentPage = parseInt(from, 10) / 20 + 1
    const pages = utils.pagination(currentPage, totalPages)

    res.render('owner.html', {
      packages,
      pages,
      currentPage,
      events: events.results,
      emailHash: userProfile.profile.id,
      joinDate: joinMonth + ' ' + joinYear,
      owner: req.params.owner,
      name: userProfile.profile.name
    })
  })

  return router
}
