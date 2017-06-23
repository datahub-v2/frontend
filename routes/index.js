'use strict'

var express = require('express')


module.exports = function() {
  // eslint-disable-next-line new-cap
  var router = express.Router()

  router.get('/', function (req, res) {
		res.send('Hello Data Ninja!')
	})

  return router
}

