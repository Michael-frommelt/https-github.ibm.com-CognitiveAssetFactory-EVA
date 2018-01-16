/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const variablesContainer = globalDatabase.config.containers.variables;

exports.findVariable = function(match, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(variablesContainer).find({
        name: match.match[1]
    }).toArray(function(err, result) {
        if (err) {
            return callbackError(err);
        } else {
            return callbackSuccess(result);
        }
    });
};
