/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
// ##############################
// ## SETUP                    ##
// ##############################
// cache roles for better performance
var cache = require('./cache.js');
var db = require('./db/db.js').getDatabase();
const permissions = require('../config/permissions.js');

module.exports.init = function() {
    return db.getRoles().then(rolesFromDB => {
        cache.set('permissions_roles', rolesFromDB);
    });
}

// #######################################
// ## API for checking user permissions ##
// #######################################
function hasPermission(userObject, permissionToCheck = 'isAuthenticated') {
    // if the user is null or undefined, it cannot have any permission
    if (userObject == null) return false;
    // if the user is defined, the special permission "isAuthenticated" given
    if (permissionToCheck === 'isAuthenticated') return true;
    // handle the special permission "isAdmin"
    if (permissionToCheck === 'isAdmin') {
        return userObject.clients && userObject.clients.some((client) =>
            client === "admin");
    }
    // if the permission is not defined, it cannot be given
    if (!permissions.includes(permissionToCheck)) return false;
    // check if the permission is in the array of additional permissions for the user
    if (Array.isArray(userObject.permissions) && userObject.permissions.includes(permissionToCheck)) return true;
    // check if the permission is covered by the role of the user

    const userRole = cache.get('permissions_roles').find((role) => role.id === userObject.role);
    if (userRole != null && userRole.permissions.includes(permissionToCheck)) return true;
    // if none of these match, the permission is not given
    return false;
}
module.exports.hasPermission = hasPermission;

function mwHasPermission(permissionToCheck) {
    return function middlewareFunction(req, res, next) {
        if (hasPermission(req.user, permissionToCheck)) {
            next();
        } else {
            const statusCode = permissionToCheck === 'isAuthenticated' ? 401 : 403;
            res.status(statusCode).end();
        }
    };
}
module.exports.mwHasPermission = mwHasPermission;

module.exports.mwHasSomePermission = function(...permissionsToCheck) {
    return function middlewareOrFunction(req, res, next) {
        if (req.user == null) {
            return res.status(401).end();
        }

        const isAllowed = permissionsToCheck.some((permission) => {
            if (typeof permission !== 'string') {
                console.error('Permission API: middlewareHasOnePermission skipped a non-string');
                return false;
            } else {
                return hasPermission(req.user, permission);
            }
        });

        if (isAllowed) {
            next();
        } else {
            res.status(403).end();
        }
    };
};

module.exports.mwHasAllPermissions = function(...permissionsToCheck) {
    return function middlewareAndFunction(req, res, next) {
        if (req.user == null) {
            return res.status(401).end();
        }

        const isAllowed = permissionsToCheck.every((permission) => {
            if (typeof permission !== 'string') {
                console.error('Permission API: middlewareHasAllPermissions skipped a non-string');
                return false;
            } else {
                return hasPermission(req.user, permission);
            }
        });

        if (isAllowed) {
            next();
        } else {
            res.status(403).end();
        }
    };
};
