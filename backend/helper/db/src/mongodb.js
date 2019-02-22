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
