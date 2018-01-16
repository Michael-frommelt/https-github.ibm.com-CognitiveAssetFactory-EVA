/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const configContainer = globalDatabase.config.containers.config;
const clientContainer = globalDatabase.config.containers.clients;
const rolesContainer = globalDatabase.config.containers.roles;

exports.getRoles = function() {
    return globalDatabase.connection.collection(rolesContainer).find({}, {
        _id: 0
    }).toArray();
};

exports.getClients = function(callbackSuccess, callbackError) {
    globalDatabase.connection.collection(clientContainer).find({}).toArray(function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }
        if (result.length === 0) {
            return callbackError('clients_not_found');
        }

        return callbackSuccess(result);
    });
};

exports.getAllConfigs = function(callbackSuccess, callbackError) {
    globalDatabase.connection.collection(configContainer).find().toArray(function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }
        if (result.length === 0) {
            return callbackError('no_config_found');
        }

        return callbackSuccess(result);
    });
};
