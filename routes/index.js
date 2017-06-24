'use strict'

var express = require('express')


module.exports = function() {
  // eslint-disable-next-line new-cap
  var router = express.Router()

  router.get('/', function (req, res) {
    res.render('home.html', {
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
