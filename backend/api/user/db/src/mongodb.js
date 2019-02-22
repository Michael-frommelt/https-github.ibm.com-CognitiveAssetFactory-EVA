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

//List all users
exports.listUsers = function(callbackSuccess, callbackError) {
    globalDatabase.connection.collection(usersContainer).find().toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        if (result.length === 0) {
            return callbackError(500, 'no_users_found');
        }

        return callbackSuccess(result);
    });
};

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

// Use Mongodb query to find the user just based on user name
exports.existUser = function(username, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(usersContainer).find({
        username: username
    }).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else if (result.length > 0) {
            return callbackSuccess(true);
        }
        return callbackSuccess(false);
    });
};

//Add user
exports.registerUser = function(user, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(usersContainer).save(user, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess(result.result);
        }
    });
};

//Delete user
exports.deleteUser = function(username, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(usersContainer).remove({
        username: username
    }, {
        justOne: true
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess(result.result);
        }
    });
};

//Update user
exports.updateUser = function(username, user, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(usersContainer).updateOne({
        username: username
    }, {
        $set: {
            username: user.username,
            password: user.password,
            clients: user.clients,
            debugmode: user.debugmode,
            role: user.role,
            permissions: user.permissions,
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess(result.result);
        }
    });
};
