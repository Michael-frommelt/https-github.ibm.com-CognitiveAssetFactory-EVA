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
    // delete the _id property, because we aren't allowed to overwrite it
    delete object._id;

    globalDatabase.connection.collection(configContainer).update({
        id: id
    }, {
        $set: object
    }, function(err, result) {
        if (err) {
            console.log(err);
            return callbackError('error_updating_document');
        }

        return callbackSuccess(result);
    });
};

exports.getConfig = function(id, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(configContainer).find({
        id: id
    }).toArray(function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }
        if (result.length === 0) {
            return callbackError('config_not_found');
        }

        return callbackSuccess(result[0]);
    });
};
