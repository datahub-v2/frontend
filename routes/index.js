'use strict'

const fs = require('fs')
const path = require('path')

const express = require('express')
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
    const listOfShowcasePkgId = config.get('showcasePackages')
    const listOfTutorialPkgId = config.get('tutorialPackages')
    const showcasePackages = await api.getPackages(listOfShowcasePkgId)
    const tutorialPackages = await api.getPackages(listOfTutorialPkgId)
    res.render('home.html', {
      title: 'Home',
      showcasePackages,
      tutorialPackages
    })
  })

  // ----------------------------
  // Redirects for old.datahub.io
  //
  // come first to avoid any risk of conflict with /:owner or /:owner/:dataset

  function redirect(path, base='https://old.datahub.io') {
    return function(req, res) {
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
      res.cookie('name', isAuthenticated.profile.name)
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
      parsedWithFM.attributes.author = authors[parsedWithFM.attributes.author]
      parsedWithFM.path = `blog/${post.slice(11, -3)}`
      listOfPosts.unshift(parsedWithFM)
    })
    res.render('blog.html', {
      title: 'Blog',
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
          author: authors[parsedWithFM.attributes.author],
          content: utils.md.render(parsedWithFM.body)
        })
      })
    } else {
      res.status(404).send('Sorry no post was found')
      return
    }
  }
  const authors = {
    'Rufus Pollock': {name: 'Rufus Pollock', gravatar: md5('rufus.pollock@datopian.com')},
    'Anuar Ustayev': {name: 'Anuar Ustayev', gravatar: md5('anuar.ustayev@gmail.com')},
    'Irakli Mchedlishvili': {name: 'Irakli Mchedlishvili', gravatar: md5('irakli.mchedlishvili@datopian.com')},
    'Meiran Zhiyenbayev': {name: 'Meiran Zhiyenbayev', gravatar: md5('meiran1991@gmail.com')},
    'Adam Kariv': {name: 'Adam Kariv', gravatar: md5('adam.kariv@gmail.com')}
  }
  // ===== /end blog

  router.get('/:owner/:name', async (req, res) => {
    let normalizedDp = null
    const userAndPkgId = await api.resolve(path.join(req.params.owner, req.params.name))
    try {
      normalizedDp = await api.getPackage(userAndPkgId.userid, userAndPkgId.packageid)
    } catch (err) {
      if (err.name === 'BadStatusCode' && err.res.status !== 404) {
        throw err
      }
    }
    let status = {state: ''}
    // If pipelineStatus API does not respond within 5 sec,
    // then render the page without status:
    const timeoutObj = setTimeout(() => {
      renderPage(status)
    }, 5000)

    try {
      status = await api.pipelineStatus(userAndPkgId.userid, userAndPkgId.packageid, 'status')
      clearTimeout(timeoutObj)
      renderPage(status)
    } catch (err) {
      // Page should still load but console log error so we can debug
      console.error('> pipelineStatus api failed.')
    }

    function renderPage(status) {
      if (normalizedDp) { // In pkgstore
        res.render('showcase.html', {
          title: req.params.owner + ' | ' + req.params.name,
          dataset: normalizedDp,
          owner: req.params.owner,
          // eslint-disable-next-line no-useless-escape, quotes
          dpId: JSON.stringify(normalizedDp).replace(/\\/g, '\\\\').replace(/\'/g, "\\'"),
          status: status.state,
          successUrl: `/${req.params.owner}/${req.params.name}`,
          failUrl: `/${req.params.owner}/${req.params.name}/pipelines`,
          statusApi: `${config.get('API_URL')}/source/${userAndPkgId.userid}/${userAndPkgId.packageid}/status`
        })
      } else { // Not in pkgstore
        if (status && status.state) {
          res.render('uploading.html', {
            successUrl: `/${req.params.owner}/${req.params.name}`,
            failUrl: `/${req.params.owner}/${req.params.name}/pipelines`,
            statusApi: `${config.get('API_URL')}/source/${userAndPkgId.userid}/${userAndPkgId.packageid}/status`,
            name: req.params.name,
            owner: req.params.owner
          })
        } else { // Nor in pipelines
          res.status(404).send('Sorry, this dataset was not found.')
          return
        }
      }
    }
  })

  router.get('/:owner/:name/pipelines', async (req, res) => {
    const userAndPkgId = await api.resolve(path.join(req.params.owner, req.params.name))
    try {
      const status = await api.pipelineStatus(userAndPkgId.userid, userAndPkgId.packageid, 'info')
      const resolvedStates = ['SUCCEEDED', 'FAILED']
      if (resolvedStates.includes(status.state)) {
        res.render('pipelines.html', {
          status
        })
      } else {
        res.status(404).send('Sorry, this page was not found.')
      }
    } catch (err) {
      if (err.status === 404) { // Pkgstore 404 + pipeline status 404 => dataset does not exist
        res.status(404).send('Sorry, this page was not found.')
        return
      } else {
        throw err
      }
    }
  })

  router.get('/:owner/:name/datapackage.json', async (req, res) => {
    let normalizedDp = null
    const userAndPkgId = await api.resolve(path.join(req.params.owner, req.params.name))
    if (!userAndPkgId.userid) {
      res.status(404).send('Sorry, this page was not found.')
      return
    }
    try {
      normalizedDp = await api.getPackage(userAndPkgId.userid, userAndPkgId.packageid)
    } catch (err) {
      if (err.name === 'BadStatusCode' && err.res.status === 404) {
        res.status(404).send('Sorry, we cannot locate that dataset for you.')
        return
      }
      throw err
    }

    res.redirect(`${normalizedDp.path}/datapackage.json`)
  })

  router.get('/:owner/:name/r/:fileNameOrIndex', async (req, res) => {
    let normalizedDp = null
    const userAndPkgId = await api.resolve(path.join(req.params.owner, req.params.name))
    if (!userAndPkgId.userid) {
      res.status(404).send('Sorry, this page was not found.')
      return
    }
    try {
      normalizedDp = await api.getPackage(userAndPkgId.userid, userAndPkgId.packageid)
    } catch (err) {
      if (err.name === 'BadStatusCode' && err.res.status === 404) {
        res.status(404).send('Sorry, we cannot locate that dataset for you.')
        return
      }
      throw err
    }

    const fileParts = path.parse(req.params.fileNameOrIndex)
    const extension = fileParts.ext
    const name = fileParts.name

    let resource
    // Check if file name is a number
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
    }

    res.redirect(`${resource.path}`)
  })

  router.get('/:owner/:name/events', async (req, res, next) => {
    // First check if dataset exists
    const userAndPkgId = await api.resolve(path.join(req.params.owner, req.params.name))
    const response = await api.getPackageFile(userAndPkgId.userid, req.params.name)
    if (response.status === 200) {
      const events = await api.getEvents(`owner="${req.params.owner}"&dataset="${req.params.name}"`, req.cookies.jwt)
      events.results = events.results.map(item => {
        item.timeago = timeago().format(item.timestamp)
        return item
      })
      res.render('events.html', {
        events: events.results,
        username: req.params.owner
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
      title: 'Offers'
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
