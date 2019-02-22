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
    globalDatabase.connection.use(usersContainer).find({
        "selector": {}
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        if (result.docs[0] == undefined) {
            return callbackError(500, 'no_users_found');
        }

        return callbackSuccess(result.docs);
    });
};

//Get a single user by username
exports.getUser = function(username, callbackSuccess, callbackError) {
    globalDatabase.connection.use(usersContainer).find({
        "selector": {
            username: username
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, 'db_connection_error');
        } else if (result.docs[0] == undefined) {
            return callbackError(500, 'user_not_found');
        } else return callbackSuccess(result.docs[0]);
    });
};

exports.existUser = function(username, callbackSuccess, callbackError) {
    globalDatabase.connection.use(usersContainer).find({
        "selector": {
            username: username
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else if (result.docs[0] == undefined) {
            return callbackSuccess(false);
        } else return callbackSuccess(true);
    });
};

//Add user
exports.registerUser = function(user, callbackSuccess, callbackError) {

    if (user._id == undefined) {
        globalDatabase.connection.use(usersContainer).insert(user, function(err, body, header) {
            if (err) {
                return callbackError(500, err);
            } else {
                return callbackSuccess(body);
            }
        });
    } else {
        globalDatabase.connection.use(usersContainer).find({
            "selector": {
                _id: user._id
            }
        }, function(err, findResult) {
          if (err) return callbackError(500, err);
            if (findResult.docs[0] != undefined) {
                user._rev = findResult.docs[0]._rev;
            }
            globalDatabase.connection.use(usersContainer).insert(user, function(err, body, header) {
                if (err) {
                    return callbackError(500, err);
                } else {
                    return callbackSuccess(body);
                }
            });
        })
    }
};

//Delete user
exports.deleteUser = function(username, callbackSuccess, callbackError) {

    globalDatabase.connection.use(usersContainer).find({
        "selector": {
            username: username
        }
    }, function(err, result) {
        if (!err && result.docs[0] != undefined) {
            globalDatabase.connection.use(usersContainer).destroy(result.docs[0]._id, result.docs[0]._rev, function(err, body, header) {
                if (err) {
                    return callbackError(500, err);
                }
                return callbackSuccess(body);
            })
        } else if (err) return callbackError(500, err);
    })
};

//Update user
exports.updateUser = function(username, user, callbackSuccess, callbackError) {
    globalDatabase.connection.use(usersContainer).find({
        "selector": {
            username: username
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else if(result.docs[0] !== undefined){
            return globalDatabase.connection.use(usersContainer).insert({
                _id: result.docs[0]._id,
                _rev: result.docs[0]._rev,
                username: user.username,
                password: user.password,
                clients: user.clients,
                debugmode: user.debugmode,
                role: user.role,
                permissions: user.permissions
            }, function(err, body, header) {
                if (err) {
                    return callbackError(500, err);
                } else {
                    return callbackSuccess(body);
                }
            });
        } else {
          callbackError(500, 'user_not_found')
        }
    });
};
