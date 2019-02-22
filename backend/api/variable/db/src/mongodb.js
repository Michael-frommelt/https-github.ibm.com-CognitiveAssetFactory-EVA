/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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

exports.upsertVariable = function( varia, override) {
  let insertLogic = {};
  if (override === true) {
    insertLogic = {
      $set: varia
    };
  } else {
    insertLogic = {
      $setOnInsert: varia
    };
  }
  return globalDatabase.connection.collection('variables').updateOne({
    name: varia.variableName
  }, insertLogic, {
    upsert: true
  }).then(function(result) {
    return {
      inserted: result.upsertedId ? 1 : 0,
      modified: result.modifiedCount
    };
  });
};