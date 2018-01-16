/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const appsContainer = globalDatabase.config.containers.apps;
const sessionsContainer = globalDatabase.config.containers.sessions;

exports.getApp = function(app_id, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(appsContainer).find({
        app_id: app_id
    }).toArray(function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }
        if (result.length === 0) {
            return callbackError('app_not_found');
        }

        return callbackSuccess(result[0]);
    });
};

exports.listSession = function(callbackSuccess, callbackError) {
    globalDatabase.connection.collection(sessionsContainer).find().toArray(function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }

        return callbackSuccess(result);
    });
};

exports.deleteSession = function(session_id, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(sessionsContainer).remove({
        session_id: session_id
    }, function(err, result) {
        if (err) {
            return callbackError({
                error: 'error_deleting_session',
                session_id: 'session_id'
            });
        }

        return callbackSuccess(session_id);
    });
};

exports.getSession = function(session_id, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(sessionsContainer).find({
        session_id: session_id
    }).toArray(function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }
        if (result.length === 0) {
            return callbackSuccess({
                session_id: session_id,
                created: Date.now(),
                updated: Date.now(),
                session: {}
            });
        }

        return callbackSuccess(result[0]);
    });
};

exports.saveSession = function(session_object, callbackSuccess, callbackError) {
    session_object.updated = Date.now();

    globalDatabase.connection.collection(sessionsContainer).save(session_object, function(err) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess();
        }
    });
};
