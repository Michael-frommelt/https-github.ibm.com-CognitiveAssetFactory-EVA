/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

const configContainer = globalDatabase.config.containers.config;
const clientContainer = globalDatabase.config.containers.clients;
const rolesContainer = globalDatabase.config.containers.roles;

exports.getRoles = function() {
    return new Promise(function (resolve, reject) {
        globalDatabase.connection.use(rolesContainer).find({
            "selector": {},
            "fields": [
                "id",
                "name",
                "permissions"
            ]
        }, function(err, result) {
            if (err) {
                return reject('db_connection_error');
            }
            if (result.docs[0] === undefined) {
                return reject('roles_not_found');
            }

            return resolve(result.docs);
        });
    });
};

exports.getClients = function(callbackSuccess, callbackError) {

    globalDatabase.connection.use(clientContainer).find({
        "selector": {}
    }, function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }
        if (result.docs[0] === undefined) {
            return callbackError('clients_not_found');
        }

        return callbackSuccess(result.docs);
    });
};


exports.getConfig = function(id, callbackSuccess, callbackError) {

    globalDatabase.connection.use(configContainer).find({
        "selector": {
            id: id
        }
    }, function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }
        if (result.docs[0] === undefined) {
            return callbackError('user_not_found');
        }
        return callbackSuccess(result.docs[0]);
    });
};

exports.getAllConfigs = function(callbackSuccess, callbackError) {
    globalDatabase.connection.use(configContainer).find({
        "selector": {}
    }, function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }
        if (result.docs[0] === undefined) {
            return callbackError('no_config_found');
        }


         return callbackSuccess(result.docs);
    });
};
