/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
// local strategy (signin and signup) for passport user handling
var LocalStrategy = require('passport-local').Strategy;
var clients = require('../helper/clients.js');
var db = require('./db/db.js').getDatabase();
var bcrypt = require('bcrypt-nodejs');

module.exports = function(passport) {
    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.username);
    });

    // used to deserialize the user
    passport.deserializeUser(function(username, done) {
        // Use db query to find the user based on user name
        db.getUser(username, function(result) {
            var user = result;
            var userClientIds = user.clients;
            user.clients = [];

            for (var index in userClientIds) {
                var client = clients.findClientById(userClientIds[index]);
                if (client !== null) {
                    user.clients.push(client);
                }
            }

            done(null, user);
        }, function(errReason) {
            return done(null, false, {
                code: errReason
            });
        });
    });

    passport.use('local-login', new LocalStrategy({
            passReqToCallback: true // allows to pass back the entire request to the callback
        },
        function(req, username, password, done) {
            var body = req.body;

            // Use db query to find the user based on user name
            db.getUser(username, function(result) {
                // user was found, now determine if password matches
                var user = result;
                if (bcrypt.compareSync(password, user.password)) {

                    var clientAllowed = false;
                    for (var clientIndex in user.clients) {
                        if (body.client === user.clients[clientIndex]) {
                            clientAllowed = true;
                        }
                    }

                    if (!clientAllowed) {
                        return done(null, false, {
                            code: "client_not_allowed"
                        });
                    } else {
                        // all is well, return successful user
                        return done(null, user);
                    }
                } else {
                    return done(null, false, {
                        code: "wrong_username_or_password"
                    });
                }
            }, function(errReason, errMessage) {
                if (errMessage === "user_not_found") {
                    return done(null, false, {
                        code: "wrong_username_or_password"
                    });
                }

                return done(null, false, {
                    code: errMessage,
                    internalServerError: true
                });
            });
        }
    ));
};
