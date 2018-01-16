/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
/**
 * Node backend application for handling requests, routing, registration and login
 * Used Node components: Express (+ plugins) and Passport
 */

'use strict';

global.globalDatabase = {
    type: null,
    connection: null,
    config: null
};

// required node dependencies
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    passport = require('passport');

var appEnv = require('./env.js');

var db;
try {
    db = require('./db/db.js').getDatabase();
} catch (err) {
    console.log("db.js could not be loaded correctly. shutting down!");
    console.log(err);
    return process.exit(1);
}

var loadedAPIs = {};
var initExpressApp = function() {
    // pass passport for configuration
    require('./config/passport.js')(passport);

    // set up express application
    app.set('views', __dirname + '/../frontend/views');
    app.set('view engine', 'html'); // set up html for templating
    app.engine('.html', require('ejs').__express);
    app.use(express.static(__dirname + '/../frontend/public'));
    // required for passport
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.use(methodOverride());
    app.use(session({
        secret: 'qwertyuio',
        resave: false,
        saveUninitialized: true
        // ,
        // store: store
    }));

    // initialize passport and create session handling
    app.use(passport.initialize());
    app.use(passport.session());

    // loading apis defined in ./config/apis.js
    var apiArray = require('./config/apis.js');
    for(let key in apiArray) {
        loadedAPIs[key] = require(apiArray[key]);
        loadedAPIs[key].createRoutes(app);
    }

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        res.status(404).json({
            error: 'Route "' + req.url + '" not found.'
        });
    });
};

// log registered routes
var logRegisteredRoutes = function() {
    function space(x) {
        var res = "";
        for (; x > 0; x--) {
            res += " ";
        }
        return res;
    }

    console.log("#################################################################");
    console.log("### DISPLAYING REGISTERED ROUTES:                             ###");
    console.log("###                                                           ###");
    app._router.stack.forEach(function(r) {
        if (r.route && r.route.path) {
            var method = r.route.stack[0].method.toUpperCase();
            console.log("### " + method + space(8 - method.length) + r.route.path + space(50 - r.route.path.length) + "###");
        }
    })
    console.log("###                                                           ###");
    console.log("#################################################################");
}


//////////////////////////////
// Catch unhandledRejections
//////////////////////////////
process.on('unhandledRejection', function(reason, p) {
    if (reason && reason.stack) {
        throw new Error(reason.stack);
    } else {
        throw new Error("unhandledRejection caught. Unknown Error.");
    }
});


//////////////////////////////
// Start the server
//////////////////////////////

// test the db connection
db.init(function(connection) {
    console.log(connection + ' connection was successful');
    var configHelper = require('./helper/config.js');
    configHelper.init(function() {
        console.log('configs loaded');

        var clientsHelper = require('./helper/clients.js');
        clientsHelper.init(function() {
            console.log('clients loaded');

            var permissionsHelper = require('./helper/permissions.js');
            permissionsHelper.init().then(function () {
                console.log('roles loaded');

                // initialize express app, apis and routes
                initExpressApp();

                // show me what you loaded :)
                logRegisteredRoutes();

                // Start listening after all initialized functions
                app.listen(appEnv.port, function() {
                    console.log('Backend server started on ' + appEnv.url);
                });
            });
        }, function(errReason) {
            console.log('clients NOT loaded');
            return process.exit(1);
        });

        return;
    }, function(error) {
        console.error('configs NOT loaded', error);
        return process.exit(1);
    });
    return;
}, function(connection) {
    console.log('Failed to ping ' + connection + '. Did the network just go down?');
    return process.exit(1);
});
