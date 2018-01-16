/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
'use strict';

// ##############################
// ## IMPORTS                  ##
// ##############################
const fs = require('fs');
const db = require('./db/db.js').getDatabase();
const rolesContainer = globalDatabase.config.containers.roles;
const permissions = require('../../config/permissions.js');
const path = require('path');
const permissionsHelper = require('../../helper/permissions.js');
var cache = require('../../helper/cache.js');

// ##############################
// ## ROUTES                   ##
// ##############################
module.exports.createRoutes = function(app) {
    app.get('/api/permission/import.js', getPermissions);

    app.get('/api/role/', getRoles);
    app.post('/api/role/:roleId', permissionsHelper.mwHasPermission('editRoles'), saveRole);
    app.delete('/api/role/:roleId', permissionsHelper.mwHasPermission('editRoles'), deleteRole);

    app.get('/api/rolereload/', permissionsHelper.mwHasPermission('editConfiguration'), reloadRoles);
};

// ##############################
// ## SETUP                    ##
// ##############################
function reloadRoles(req, res) {
    permissionsHelper.init().then(() => res.status(204).end());
}

// #######################################
// ## REST API for role management      ##
// #######################################
function getPermissions(req, res) {
    res.setHeader('Content-Type', 'text/javascript');
    fs.createReadStream(path.join(__dirname, '../../config/permissions.js')).pipe(res);
}

function getRoles(req, res) {
    res.json(cache.get('permissions_roles'));
}

function saveRole(req, res) {
    const role = req.body;
    if (!validateRole(role)) {
        return res.status(400).send('Invalid role format');
    }

    db.updateRole(rolesContainer, {
        id: req.params.roleId
    }, {
        $set: role
    }, {
        upsert: true
    }).then(() => {
        // update the cache if saving the role is successful
        const roleToUpdateIndex = cache.get('permissions_roles').findIndex((cachedRole) => cachedRole.id === req.params.roleId);
        if (roleToUpdateIndex === -1) {
            var roles = cache.get('permissions_roles');
            roles.push(role);
            cache.set('permissions_roles', roles);
        } else {
            var roles = cache.get('permissions_roles');
            roles[roleToUpdateIndex] = role;
            cache.set('permissions_roles', roles);
        }

        res.status(204).end();
    }, error => res.status(error.status || 500).send(error.message));
}

function deleteRole(req, res) {
    db.deleteRole(rolesContainer, {
        id: req.params.roleId
    }).then(
        () => {
            // remove the role from the cache if deleting it is successful
            var roles = cache.get('permissions_roles');
            const roleToDeleteIndex = roles.findIndex((cachedRole) => cachedRole.id === req.params.roleId);
            if (roleToDeleteIndex !== -1) {
                roles.splice(roleToDeleteIndex, 1);
            }

            cache.set('permissions_roles', roles);
            res.status(204).end();
        },
        error => res.status(error.status || 500).send(error.message)
    );
}

/* role object {
 *  id: string
 *  name: string
 *  permissions: [string] -> validated with permissions
 * } */
function validateRole(role) {
    return typeof role.id === 'string' && typeof role.name === 'string' &&
        Array.isArray(role.permissions) && role.permissions.every(permission => permissions.includes(permission));
}
