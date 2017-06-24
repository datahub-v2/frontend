'use strict'

var express = require('express')


module.exports = function() {
  // eslint-disable-next-line new-cap
  var router = express.Router()

  router.get('/', function (req, res) {
    // TODO: check if a user is signed in here later + add tests:
    if (false) {
      res.render('dashboard.html', {
        title: 'Dashboard'
      });
    }
    res.render('home.html', {
      title: 'Home'
    });
	})

  router.get('/:owner/:id', function (req, res) {
    res.render('showcase.html', {
    });
	})

  router.get('/search', function (req, res) {
    res.render('search.html', {

    });
  })

  router.get('/:owner', function (req, res) {
    res.render('owner.html', {

    });
  })

  return router
}
