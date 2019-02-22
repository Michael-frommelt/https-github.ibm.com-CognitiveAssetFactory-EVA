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
    globalDatabase.connection.collection(usersContainer).find({
        username: username
    }).toArray(function(err, result) {
        if (err) {
            return callbackError(500, 'db_connection_error');
        }
        if (result.length === 0) {
            return callbackError(500, 'user_not_found');
        }

        return callbackSuccess(result[0]);
    });
};
