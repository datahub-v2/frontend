'use strict'

const path = require('path')
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
    let extendedDp = null
    const userAndPkgId = await api.resolve(path.join(req.params.owner, req.params.name))
    try {
      extendedDp = await api.getPackage(userAndPkgId.userid, userAndPkgId.packageid)
    } catch (err) {
      if (err.name === 'BadStatusCode' && err.res.status === 404) {
        res.status(404).send('Sorry we cannot locate that dataset for you!')
        return
      }
      throw err
    }

    const normalizedDp = utils.normalize(extendedDp)

    res.render('showcase.html', {
      title: req.params.owner + ' | ' + req.params.name,
      dataset: utils.extendDpjson(normalizedDp),
      owner: req.params.owner,
      // eslint-disable-next-line no-useless-escape, quotes
      dpId: JSON.stringify(normalizedDp).replace(/\\/g, '\\\\').replace(/\'/g, "\\'")
    })
  })

  router.get('/:owner/:name/r/:fileNameOrIndex', async (req, res) => {
    let extendedDp = null
    const userAndPkgId = await api.resolve(path.join(req.params.owner, req.params.name))
    try {
      extendedDp = await api.getPackage(userAndPkgId.userid, userAndPkgId.packageid)
    } catch (err) {
      if (err.name === 'BadStatusCode' && err.res.status === 404) {
        res.status(404).send('Sorry we cannot locate that dataset for you!')
        return
      }
      throw err
    }
    const normalizedDp = utils.normalize(extendedDp)

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
      res.status(404).send('Sorry we cannot locate that file for you!')
    }

    // If resource was found then identify required format by given extension
    if (!(resource.format === extension.substring(1))) {
      resource = resource.alternates.find(res => extension.substring(1) === res.format)
    }

    res.redirect(`${normalizedDp.path}/${resource.path}`)
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
