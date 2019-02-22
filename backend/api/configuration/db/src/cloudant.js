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

exports.updateConfig = function(id, object, callbackSuccess, callbackError) {

    globalDatabase.connection.use(configContainer).find({
        "selector": {
            "id": id
        }
    }, function(err, result) {
        if (err) {
            return callbackError('error_updating_document');
        }
        object._id = result.docs[0]._id;
        object._rev = result.docs[0]._rev;
        return globalDatabase.connection.use(configContainer).insert(object, function(err, body, header) {
            if (err) {
                return callbackError('error_updating_document');
            }
            return callbackSuccess(body);
        })
    })
};

exports.getConfig = function(id, callbackSuccess, callbackError) {
    globalDatabase.connection.use(configContainer).find({
        "selector": {
            "id": id
        }
    }, function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }
        if (result.docs.length === 0) {

            return callbackError('config_not_found');
        }
        return callbackSuccess(result.docs[0]);
    });
};
