/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
exports.createProxyForExternalFrontend = function(app, bodyParser, proxy, backend) {
	var auth_token = "";

	app.use('/api/public', bodyParser.json(), proxy('/api/public',
		{
			target: backend,
			changeOrigin: true,
			onProxyReq(proxyReq, req, res) {
				proxyReq.setHeader('x-access-token', auth_token);

				// Make any needed POST parameter changes
				var body = {};
				if(req.body !== undefined) {
					body = JSON.parse(JSON.stringify(req.body));
				}
				body.session_id = "testsession";

				// Remove body-parser body object from the request
	      if ( req.body ) delete req.body;

	      // URI encode JSON object
	      body = Object.keys( body ).map(function( key ) {
	          return encodeURIComponent( key ) + '=' + encodeURIComponent( body[ key ])
	      }).join('&');

	      // Update header
	      proxyReq.setHeader( 'content-type', 'application/x-www-form-urlencoded' );
	      proxyReq.setHeader( 'content-length', body.length );

	      // Write out body changes to the proxyReq stream
	      proxyReq.write( body );
	      proxyReq.end();
			}
		})
	);

	// Use a querystring parser to encode output.
	var rq = require('request');
	var fs = require('fs');

	var async = require('async');


	var authEndpoint = "/api/public/authenticate";
	var _23hours = 23 * 60 * 60 * 1000;	// orchestrator's token validity in hours (max 24hrs)

	// Request new token from the orchestrator's server
	var auth = function() {
		var payload = {
			app_id: "testapp",
			secret: "testsecret"
		};

		var options = {
			url: backend + authEndpoint,
			form: payload,
		};

		rq.post(options, function (errorMsg, response, body) {
			if (errorMsg) {
				console.log("Error auth: " + errorMsg);
				if(errorMsg.errno === 'ECONNREFUSED') {
					setTimeout(auth, 3 * 1000); //Execute again after 3 seconds
				}
			} else {
				body = JSON.parse(body);
				if(body.success) {
					auth_token = body.auth_token;
					console.log("Success auth. Saved auth_token.");
				}	else {
					console.log("Error auth: wrong user/password");
				}
			}
		});
	}

	auth();
	setInterval(auth, _23hours);
}
