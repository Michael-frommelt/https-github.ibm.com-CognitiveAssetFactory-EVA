/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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
        if (result.docs[0] === undefined) {
            return callbackError(500, 'user_not_found');
        }

        return callbackSuccess(result.docs[0]);
    });
};
