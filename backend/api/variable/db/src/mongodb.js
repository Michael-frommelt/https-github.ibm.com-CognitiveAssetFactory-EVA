/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const variablesContainer = globalDatabase.config.containers.variables;

exports.checkVariableUniqueness = function(name, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(variablesContainer).find({
        name: name
    }).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else if (result.length > 0) {
            return callbackSuccess(false);
        }
        return callbackSuccess(true);
    });
};

exports.deleteVariable = function(condition) {
    return globalDatabase.connection.collection(variablesContainer).deleteOne(condition);
};

exports.saveVariable = function(object) {
    return globalDatabase.connection.collection(variablesContainer).save(object);
};

exports.updateVariable = function(condition, object, options) {
    return globalDatabase.connection.collection(variablesContainer).update(condition, object, options);
};

exports.getVariables = function(limit) {
    let cursor = globalDatabase.connection.collection(variablesContainer).find({}, {
        _id: 0
    });

    if (limit) {
        cursor = cursor.limit(limit);
    }
    return cursor.toArray();
};
