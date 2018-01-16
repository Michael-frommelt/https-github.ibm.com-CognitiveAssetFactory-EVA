/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const usersContainer = globalDatabase.config.containers.users;

//Get a single user by username
exports.getUser = function(username, callbackSuccess, callbackError) {
    return globalDatabase.connection.use(usersContainer).find({
        "selector": {
            username: username
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, 'db_connection_error');
        }
        if (result.length === 0) {
            return callbackError(500, 'user_not_found');
        }

        return callbackSuccess(result.docs[0]);
    });
};
