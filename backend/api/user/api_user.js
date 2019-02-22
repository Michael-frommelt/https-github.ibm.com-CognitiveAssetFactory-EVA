/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
// ##############################
// ## IMPORTS                  ##
// ##############################
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var db = require('./db/db.js').getDatabase();
var permissions = require('../../helper/permissions.js');
var clientsHelper = require('../../helper/clients.js');


// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
    app.post('/api/user/getClients/:hidden/:technical', this.getClients);
    app.post('/api/user/getClientsForUser/:hidden/:technical', permissions.mwHasPermission('isAuthenticated'), this.getClientsForUser);
    // try to authenticate user if this route is used
    app.post('/api/user/login', this.login);
    // logout user and redirect to index page
    app.post('/api/user/logout', permissions.mwHasPermission('isAuthenticated'), this.logout);
    // try to list all users if this route is used
    app.get('/api/user/list', permissions.mwHasSomePermission('editUsers', 'editRoles'), this.listUsers);
    // try to get a single user if this route is used
    app.post('/api/user/get', permissions.mwHasPermission('editUsers'), this.getUser);
    // try to register a new user if this route is used
    app.post('/api/user/register', permissions.mwHasPermission('editUsers'), this.registerUser);
    // try to delete a single user if this route is used
    app.post('/api/user/delete', permissions.mwHasPermission('editUsers'), this.deleteUser);
    // try to update a single user if this route is used
    app.post('/api/user/update', function(req, res, next) {
        // middleware to enforce permissions, but let users edit their own data, e.g. for password changes
        if (permissions.hasPermission('editUsers') || permissions.hasPermission('editRoles') ||
            (req.body.user && req.body.user.username === req.user.username)) {
            next();
        } else {
            res.status(403).end();
        }
    }, this.updateUser);
}

// ##############################
// ## API                      ##
// ##############################
exports.getClients = function(req, res) {
    let showHidden = false;
    let showTechnical = false;
    if(req.params.hidden === "true") {
        showHidden = true;
    }
    if(req.params.technical === "true") {
        showTechnical = true;
    }

    res.json(clientsHelper.getClients(showHidden, showTechnical));
};

exports.getClientsForUser = function(req, res) {
    let showHidden = false;
    let showTechnical = false;
    if(req.params.hidden === "true") {
        showHidden = true;
    }
    if(req.params.technical === "true") {
        showTechnical = true;
    }

    res.json(clientsHelper.getUserClients(req.user, showHidden, showTechnical));
};

exports.login = function(req, res, next) {
    passport.authenticate('local-login', function(err, user, info) {
        if (err || !user) {
            if (info.internalServerError) {
                res.status(500).json(info);
            } else {
                res.status(401).json(info);
            }
        } else {
            req.logIn(user, function(err) {
                var userPermissions = user.permissions || [];
                if (permissions.hasPermission(user, 'isAdmin')) {
                    userPermissions = userPermissions.concat('isAdmin');
                }
                var isDebugmodeAllowed = user.debugmode ? user.debugmode : false;
                if (err) {
                    res.status(500).json(err);
                } else {
                    res.status(200).send({
                        success: true,
                        role: user.role,
                        permissions: userPermissions,
                        debugmode: isDebugmodeAllowed
                    });
                }
            });
        }
    })(req, res, next);
};

exports.logout = function(req, res) {
    req.logout();
    req.session.destroy(function(err) {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).send({
                logout: true
            });
        }
    });
};

// List all users
exports.listUsers = function(req, res) {
    db.listUsers(function(result) {
        res.status(200).send(result);
    }, function(errCode, errReason) {
        console.log("An error occurred while looking up all users: " + errReason);
        return res.status(errCode).json(errReason);
    });
};

// Get a single user by username
exports.getUser = function(req, res) {
    var username = req.body.username;

    db.getUser(username, function(result) {
        res.status(200).send(result);
    }, function(errCode, errReason) {
        console.log("An error occurred while looking up the user: " + errReason);
        return res.status(errCode).json(errReason);
    });
};

// Add user
exports.registerUser = function(req, res) {

    var username = req.body.user.username;
    var password = req.body.user.password;
    var clients = req.body.user.clients || [];
    var debugmode = req.body.user.debugmode;
    var role = req.body.user.role;
    var permissions = req.body.user.permissions;

    // Use query to find the user just based on user name
    db.existUser(username, function(userExist) {
        if (userExist) {
            console.log("Username was found");
            return res.status(500).json({
                code: "username_already_exist"
            });
        }

        var hash_pass = bcrypt.hashSync(password);
        var user = {
            username: username,
            password: hash_pass,
            clients: clients,
            debugmode: debugmode,
            role: role,
            permissions: permissions,
        };
        console.log("Register User: " + username);

        db.registerUser(user, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            console.log("There was an error registering the user: " + errReason);
            res.status(errCode).json(errReason);
        });

    }, function(errCode, errReason) {
        console.log("There was an error registering the user: " + errReason);
        return res.status(errCode).json(errReason);
    });
};

//Delete user
exports.deleteUser = function(req, res) {
    var username = req.body.username;
    db.existUser(username, function(userExist) {
        if (userExist) {
            db.deleteUser(username, function(result) {
                res.status(200).send(result);
            }, function(errCode, errReason) {
                console.log("There was an error deleting the user: " + errReason);
                res.status(errCode).json(errReason);
            });
        }
    }, function(errCode, errReason) {
        console.log("There was an error deleting the user: " + errReason);
        return res.status(errCode).json(errReason);
    });
};


//Update user
exports.updateUser = function(req, res) {

    if (!req.body) {
        return res.status(400).json({
            code: "request_body_missing"
        });
    }

    var username = req.body.user.username;
    var password = req.body.user.password;
    var clients = req.body.user.clients || [];
    var debugmode = req.body.user.debugmode;
    var role = req.body.user.role;
    var permissions = req.body.user.permissions;
    var passchange = req.body.passchange;

    db.existUser(username, function(userExist) {
        if (userExist) {

            var hash_pass;

            if (passchange === true) {
                hash_pass = bcrypt.hashSync(password);
            } else {
                hash_pass = password;
            }
            var user = {
                username: username,
                password: hash_pass,
                clients: clients,
                debugmode: debugmode,
                role: role,
                permissions: permissions,
            };

            db.updateUser(username, user, function(result) {
                res.status(200).send(result);
            }, function(errCode, errReason) {
                console.log("An error occurred while updating the user: " + errReason);
                res.status(errCode).json(errReason);
            });
        }
    }, function(errCode, errReason) {
        console.log("An error occurred while checking the user: " + errReason);
        return res.status(errCode).json(errReason);
    });

};
