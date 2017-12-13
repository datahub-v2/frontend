'use strict'

const fs = require('fs')
const path = require('path')
const urllib = require('url')

const express = require('express')
const fetch = require('node-fetch')
const bytes = require('bytes')
const fm = require('front-matter')
const moment = require('moment')
const md5 = require('md5')
const timeago = require('timeago.js')

const config = require('../config')
const lib = require('../lib')
const utils = require('../lib/utils')

module.exports = function () {
  // eslint-disable-next-line new-cap
  const router = express.Router()
  const api = new lib.DataHubApi(config)

  router.get('/', async (req, res) => {
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
      tutorialPackages
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

  router.get('/dashboard', async (req, res) => {
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
        res.render('dashboard.html', {
          title: 'Dashboard',
          currentUser,
          events: events.results,
          totalPackages: packages.summary.total,
          totalSpace: bytes(packages.summary.totalBytes, {decimalPlaces: 0})
        })
      } else {
        req.flash('message', 'Your token has expired. Please, login to see your dashboard.')
        res.redirect('/')
      }
    } else {
      res.status(404).send('Sorry, this page was not found.')
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

  const showDoc = function(req, res) {
    if (req.params[0]) {
      var page = req.params[0]
      var filePath = 'docs/' + page + '.md'
      if (!fs.existsSync(filePath)) {
        res.status(404).send('Sorry no documentation was found')
        return
      }

      fs.readFile(filePath, 'utf8', function(err, text) {
        if (err) throw err
        const parsedWithFM = fm(text)
        const content = utils.md.render(parsedWithFM.body)
        const date = parsedWithFM.attributes.date
          ? moment(parsedWithFM.attributes.date).format('MMMM Do, YYYY')
          : null
        const githubPath = '//github.com/okfn/data.okfn.org/blob/master/' + filePath
        res.render('docs.html', {
          title: parsedWithFM.attributes.title,
          date,
          content,
          githubPath
        })
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
  router.get(['/awesome', '/awesome/*'], (req, res) => {
    const BASE = 'https://raw.githubusercontent.com/datahubio/awesome/master/';
    let path = urllib.parse(req.path).path;
    let fullpath;
    if (path == '/awesome'){
      fullpath = BASE + 'index.md'
    } else {
      // get the page name from the path and create a full adress
      fullpath = BASE + path.split('/')[2] + '.md';
    }
    //request raw page from github
    fetch(fullpath)
      .then(function(res) {
        //TODO: handle the 404 from the github
        return res.text();
      })
      .then(function(text) {
        // parse the raw .md page and render it with an template.
        const parsedWithFM = fm(text);
        const content = utils.md.render(parsedWithFM.body);
        const date = parsedWithFM.attributes.date
          ? moment(parsedWithFM.attributes.date).format('MMMM Do, YYYY')
          : null
        res.render('awesome.html', {
          title: parsedWithFM.attributes.title,
          date,
          content,
        })
      })
      .catch(err => {
        console.log(err)
      })
  })

  // ===== /end awesome


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
      res.status(404).send('Sorry no post was found')
      return
    }
  }
  const authors = {
    'rufuspollock': {name: 'Rufus Pollock', gravatar: md5('rufus.pollock@datopian.com'), username: 'rufuspollock'},
    'anuveyatsu': {name: 'Anuar Ustayev', gravatar: md5('anuar.ustayev@gmail.com'), username: 'anuveyatsu'},
    'zelima': {name: 'Irakli Mchedlishvili', gravatar: md5('irakli.mchedlishvili@datopian.com'), username: 'zelima1'},
    'mikanebu': {name: 'Meiran Zhiyenbayev', gravatar: md5('meiran1991@gmail.com'), username: 'Mikanebu'},
    'akariv': {name: 'Adam Kariv', gravatar: md5('adam.kariv@gmail.com'), username: 'akariv'}
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
      } else if (revisionStatus.state === 'FAILED') { // Use original dp and collect failed pipelines
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
      } else if (['INPROGRESS', 'QUEUED'].includes(revisionStatus.state)) { // Use original dp
        normalizedDp = revisionStatus.spec_contents.inputs[0].parameters.descriptor
      } else {
        next('unknown state of given revision')
        return
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

        // Now render the page:
        res.render('showcase.html', {
          title: req.params.owner + ' | ' + req.params.name,
          dataset: normalizedDp,
          owner: req.params.owner,
          // eslint-disable-next-line no-useless-escape, quotes
          dpId: JSON.stringify(normalizedDp).replace(/\\/g, '\\\\').replace(/\'/g, "\\'"),
          status: status.state,
          nextUrl: `/${req.params.owner}/${req.params.name}/v/${revisionId}`,
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
      res.status(404).send('Sorry, this page was not found.')
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
    let redirectUrl = `${normalizedDp.path}/datapackage.json`
    if (normalizedDp.datahub.findability === 'private') {
      const authzToken = await api.authz(token)
      let resp = await fetch(redirectUrl)
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
      res.status(404).send('Sorry, this page was not found.')
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
      res.status(404).send('Sorry, we cannot locate that file for you.')
    }

    // If resource was found then identify required format by given extension
    if (!(resource.format === extension.substring(1))) {
      resource = resource.alternates.find(res => (extension.substring(1) === res.format && res.datahub.type !== 'derived/preview'))
      // If given format was not found then show 404
      if (!resource) {
        res.status(404).send('Sorry, we cannot locate that file for you.')
      }
    }

    // If dataset's findability is private then get a signed url for the resource
    let finalPath = resource.path
    if (normalizedDp.datahub.findability === 'private') {
      const authzToken = await api.authz(token)
      let resp = await fetch(resource.path)
      if (resp.status === 403) {
        const signedUrl = await api.checkForSignedUrl(
          resource.path, userAndPkgId.userid, null, authzToken
        )
        finalPath = signedUrl.url
      }
    }

    res.redirect(finalPath)
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
      res.status(404).send('Sorry, this page was not found.')
    } else {
      next(response)
    }
  })

  router.get('/search', async (req, res) => {
    const token = req.cookies.jwt
    const query = req.query.q ? `q="${req.query.q}"&size=20` : `size=20`
    const packages = await api.search(`${query}`, token)
    res.render('search.html', {
      packages,
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
    let desktopAppUrl, binReleaseMacos, binReleaseLinux, etagForDesktop, etagForBinary

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
    const binaryReleaseModified = await fetch('https://api.github.com/repos/datahq/datahub-cli/releases/latest', {
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
    } else { // Go and get new release
      let binRelease = await fetch('https://api.github.com/repos/datahq/datahub-cli/releases/latest')
      if (binRelease.status === 200) {
        const etag = binRelease.headers.get('ETag').slice(2)
        // Now get URLs for downloading binaries:
        binRelease = await binRelease.json()
        binReleaseMacos = binRelease.assets
          .find(asset => asset.name.includes('macos'))
          .browser_download_url
        binReleaseLinux = binRelease.assets
          .find(asset => asset.name.includes('linux'))
          .browser_download_url
        // Update binary release in the app.locals:
        const newRelease = {
          binary: {
            etag,
            macos: binReleaseMacos,
            linux: binReleaseLinux
          }
        }
        req.app.locals.github.releases = Object.assign(
          req.app.locals.github.releases,
          newRelease
        )
      } else { // If github api is unavailable then just have a link to releases page
        binReleaseMacos = 'https://github.com/datahq/datahub-cli/releases'
        binReleaseLinux = 'https://github.com/datahq/datahub-cli/releases'
      }
    }

    res.render('download.html', {
      title: 'Download',
      desktopAppUrl,
      binReleaseMacos,
      binReleaseLinux
    })
  })

  // MUST come last in order to catch all the publisher pages
  router.get('/:owner', async (req, res) => {
    // First check if user exists using resolver
    const userProfile = await api.getProfile(req.params.owner)
    if (!userProfile.found) {
      res.status(404).send('Sorry, this page was not found.')
      return
    }
    const token = req.cookies.jwt
    const events = await api.getEvents(`owner="${req.params.owner}"&size=10`, token)
    events.results = events.results.map(item => {
      item.timeago = timeago().format(item.timestamp)
      return item
    })
    const packages = await api.search(`datahub.ownerid="${userProfile.profile.id}"&size=100`, token)
    const joinDate = new Date(userProfile.profile.join_date)
    const joinYear = joinDate.getUTCFullYear()
    const joinMonth = joinDate.toLocaleString('en-us', { month: "long" })
    res.render('owner.html', {
      packages,
      events: events.results,
      emailHash: userProfile.profile.id,
      joinDate: joinMonth + ' ' + joinYear,
      owner: req.params.owner
    })
  })

  return router
}
