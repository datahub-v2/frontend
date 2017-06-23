'use strict'

var express = require('express')
var nunjucks = require('nunjucks')
var path = require('path')
var bodyParser = require('body-parser')

var config = require('./config')
var routes = require('./routes')


module.exports.start = function() {
  return new Promise(function(resolve, reject) {
    var app = express()

    app.set('config', config)
    app.set('port', config.get('app:port'))
    app.set('views', path.join(__dirname, '/views'))

    // Middlewares
    app.use('/static', express.static(path.join(__dirname, '/public')))
    app.use(
      bodyParser.urlencoded({
        extended: true
      })
    )

    // Controllers
    app.use([
      routes()
    ])

    var env = nunjucks.configure(app.get('views'), {
      autoescape: true,
      express: app
    })

    var server = app.listen(app.get('port'), function() {
      console.log('Listening on :' + app.get('port'))
      resolve(server)
    })
    app.shutdown = function() {
      server.close()
      server = null
    }
  })
}

module.exports.start()

