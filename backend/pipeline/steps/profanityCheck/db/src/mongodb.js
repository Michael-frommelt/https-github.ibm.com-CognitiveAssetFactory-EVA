/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const profanityContainer = globalDatabase.config.containers.profanityList;

exports.getProfanityList = function(callbackSuccess, callbackError) {
    globalDatabase.connection.collection(profanityContainer).find().toArray(function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }
        return callbackSuccess(result);
    });
};
