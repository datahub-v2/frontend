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
    // Get showcase and turorial packages for the front page
    const listOfShowcasePkgId = config.get('showcasePackages')
    const listOfTutorialPkgId = config.get('tutorialPackages')
    const showcasePackages = await api.getPackages(listOfShowcasePkgId)
    const tutorialPackages = await api.getPackages(listOfTutorialPkgId)
    res.render('home.html', {
      title: 'Home',
      showcasePackages,
      tutorialPackages,
      logout: req.query.logout,
      error: req.query.error
    })
  })

  router.get('/dashboard', async (req, res) => {
    if (req.cookies.jwt) {
      const currentUser = utils.getCurrentUser(req.cookies)
      res.render('dashboard.html', {
        title: 'Dashboard',
        currentUser
      })
    } else {
      res.status(404).send('Sorry, this page was not found.')
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
      res.redirect('/dashboard')
    } else {
      res.redirect('/?error=true')
    }
  })

  router.get('/logout', async (req, res) => {
    res.clearCookie('jwt')
    res.redirect('/?logout=true')
  })

  router.get('/:owner/:name', async (req, res) => {
    let dpjson = null
    try {
      dpjson = await api.getPackage(req.params.owner, req.params.name)
    } catch (err) {
      if (err.name === 'BadStatusCode' && err.res.status === 404) {
        res.status(404).send('Sorry we cannot locate that dataset for you!')
        return
      }
      throw err
    }

    const dpBitStoreUrl = [config.get('BITSTORE_URL'), 'metadata', req.params.owner, req.params.name, '_v', 'latest'].join('/')
    res.render('showcase.html', {
      title: req.params.owner + ' | ' + req.params.name,
      dataset: utils.extendDpjson(dpjson),
      datapackageUrl: dpBitStoreUrl + '/datapackage.json'
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
