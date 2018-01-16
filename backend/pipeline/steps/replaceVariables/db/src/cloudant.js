/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const variablesContainer = globalDatabase.config.containers.variables;

exports.findVariable = function(match, callbackSuccess, callbackError) {
    globalDatabase.connection.use(variablesContainer).find({
        "selector": {
            name: match.match[1]
        }
    }, function(err, result) {
        if (err) {
            return callbackError(err);
        } else {
            return callbackSuccess(result.docs);
        }
    });
};
