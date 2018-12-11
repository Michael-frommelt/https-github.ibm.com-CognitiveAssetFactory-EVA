/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

'use strict';

require( 'dotenv' ).config( {silent: true} );

var express = require('express')  // app server
, app = express()
, bodyParser = require( 'body-parser' )  // parser for post requests
, http = require('http');

var proxy = require('http-proxy-middleware');

var appEnv = require('./env');

/////////////////////////////
// Redirection of unsecure requests to https, if not running local
//////////////////////////////
if (!appEnv.isLocal) {
	app.enable('trust proxy');
	
  app.use(function(req, res, next) {
    if (req.secure) {
      next();
    } else {
      res.redirect('https://' + req.headers.host + req.url);
    }
  });
}

var backend = '';
if(appEnv.isLocal) {
	backend = 'http://localhost:8070'
} else {
	backend = process.env.BACKEND_URL;
}

app.use('/api', proxy(
	function (pathname, req) {
		return (pathname.match('^/api') && !pathname.match('^/api/public'));
	}, {
		target: backend,
		changeOrigin: true
	}
));

if(appEnv.isLocal) {
	console.log('frontend: being local -> starting proxyExternalFrontend.js');
	require('./proxyExternalFrontend.js').createProxyForExternalFrontend(app, bodyParser, proxy, backend);
} else {
	console.log('frontend: NOT local -> NOT loading proxyExternalFrontend.js');
}

app.use(bodyParser.json());

app.use(express.static(__dirname + '/public')); // load UI from public folder

var path = require('path');
global.appRoot = path.resolve(__dirname);
console.log(__dirname);

var port = appEnv.port || 8080;

app.listen(port, function() {
  console.log('Frontend server running on: ' + appEnv.url);
});
