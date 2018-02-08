/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

const appsContainer = globalDatabase.config.containers.apps;
const sessionsContainer = globalDatabase.config.containers.sessions;

exports.getApp = function(app_id, callbackSuccess, callbackError) {
  globalDatabase.connection.use(appsContainer).find({
    "selector": {
      "app_id": app_id
    }
  }, function(err, result) {
    if (err) {
      return callbackError('db_connection_error');
    }
    if (result.docs[0] === undefined) {
      return callbackError('app_not_found');
    }

    return callbackSuccess(result.docs[0]);
  });
};

exports.listSession = function(callbackSuccess, callbackError) {
  globalDatabase.connection.use(sessionsContainer).find({
    "selector": {}
  }, function(err, result) {
    if (err) {
      return callbackError('db_connection_error');
    }

    return callbackSuccess(result.docs);
  });
};

exports.deleteSession = function(session_id, callbackSuccess, callbackError) {
  globalDatabase.connection.use(sessionsContainer).find({
    "selector": {
      "session_id": session_id
    }
  }, function(err, result) {
    if (err) {
      return callbackError({
        error: 'error_deleting_session',
        session_id: 'session_id'
      });
    } else if (result.docs[0] === undefined) {
      return callbackSuccess(session_id);
    } else {
      return globalDatabase.connection.use(sessionsContainer).destroy(result.docs[0]._id, result.docs[0]._rev, function(err, body, header) {
        if (err) {
          return callbackError({
            error: 'error_deleting_session',
            session_id: 'session_id'
          });
        }
        return callbackSuccess(session_id);
      })
    }
  })
};

exports.getSession = function(session_id, callbackSuccess, callbackError) {
  globalDatabase.connection.use(sessionsContainer).find({
    "selector": {
      "session_id": session_id
    }
  }, function(err, result) {
    if (err) {
      return callbackError('db_connection_error');
    }
    if (result.docs[0] === undefined) {
      return callbackSuccess({
        session_id: session_id,
        created: Date.now(),
        updated: Date.now(),
        session: {}
      });
    }

    return callbackSuccess(result.docs[0]);
  });
};

exports.saveSession = function(session_object, callbackSuccess, callbackError) {
  session_object.updated = Date.now();

  if (session_object._id == undefined) {
    globalDatabase.connection.use(sessionsContainer).insert(session_object, function(err) {
      if (err) {
        return callbackError(500, err);
      } else {
        return callbackSuccess();
      }
    });
  } else {
    globalDatabase.connection.use(sessionsContainer).find({
      "selector": {
        "_id": session_object._id
      }
    }, function(err, findResult) {
      if (err) return callbackError(500, err);
      if (findResult.docs[0] != undefined) {
        session_object._rev = findResult.docs[0]._rev;
      }
      globalDatabase.connection.use(sessionsContainer).insert(session_object, function(err) {
        if (err) {
          return callbackError(500, err);
        } else {
          return callbackSuccess();
        }
      });
    })
  }
};
