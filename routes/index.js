'use strict'

const express = require('express')
const config = require('../config')
const lib = require('../lib')
const utils = require('../lib/utils')

module.exports = function () {
  // eslint-disable-next-line new-cap
  const router = express.Router()
  const api = new lib.DataHubApi(config)

  router.get('/', async (req, res) => {
    if (req.cookies.jwt) {
      const currentUser = utils.getCurrentUser(req.cookies)
      res.render('dashboard.html', {
        title: 'Dashboard',
        currentUser
      })
    } else {
      // Get showcase and turorial packages for the front page
      const listOfShowcasePkgId = config.get('showcasePackages')
      const listOfTutorialPkgId = config.get('tutorialPackages')
      const showcasePackages = await utils.getListOfDpWithReadme(listOfShowcasePkgId)
      const tutorialPackages = await utils.getListOfDpWithReadme(listOfTutorialPkgId)
      res.render('home.html', {
        title: 'Home',
        showcasePackages,
        tutorialPackages,
        logout: req.query.logout,
        error: req.query.error
      })
    }
  })

  router.get('/login/:provider', async (req, res) => {
    const providers = await api.authenticate()
    const providerUrlForLogin = providers.providers[req.params.provider].url
    res.redirect(providerUrlForLogin) // Which then redirects to `/sucess` if OK
  })

  router.get('/success', async (req, res) => {
    const jwt = req.query.jwt
    const isAuthenticated = await api.authenticate(jwt)
    if (isAuthenticated.authenticated) {
      res.cookie('jwt', jwt)
      res.cookie('email', isAuthenticated.profile.email)
      res.cookie('name', isAuthenticated.profile.name)
      res.redirect('/')
    } else {
      res.redirect('/?error=true')
    }
  })

  router.get('/logout', async (req, res) => {
    res.clearCookie('jwt')
    res.redirect('/?logout=true')
  })

  router.get('/:owner/:name', async (req, res) => {
    const dpjson = await api.getPackage(req.params.owner, req.params.name)
    let readme = await api.getPackageFile(req.params.owner, req.params.name, 'README.md')
    const shortReadme = utils.makeSmallReadme(readme)
    readme = utils.dpInReadme(readme, dpjson)
    readme = utils.textToMarkdown(readme)
    const dpBitStoreUrl = [config.get('BITSTORE_URL'), 'metadata', req.params.owner, req.params.name, '_v', 'latest'].join('/')
    res.render('showcase.html', {
      title: req.params.owner + ' | ' + req.params.name,
      dataset: utils.extendDpjson(dpjson),
      datapackageUrl: dpBitStoreUrl + '/datapackage.json',
      readmeShort: shortReadme,
			// eslint-disable-next-line camelcase
      readme_long: readme
    })
  })

  router.get('/search', (req, res) => {
    res.render('search.html', {
      title: 'Search'
    })
  })

  router.get('/pricing', (req, res) => {
    res.render('pricing.html', {
      title: 'Offers'
    })
  })

  router.get('/:owner', (req, res) => {
    res.render('owner.html', {
      title: req.params.owner
    })
  })

  return router
}
