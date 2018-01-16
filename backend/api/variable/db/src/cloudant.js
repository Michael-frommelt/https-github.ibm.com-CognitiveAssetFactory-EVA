/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const variablesContainer = globalDatabase.config.containers.variables;

exports.checkVariableUniqueness = function(name, callbackSuccess, callbackError) {
    globalDatabase.connection.use(variablesContainer).find({
        "selector": {
            name : name
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else if (result.docs.length > 0) {
            return callbackSuccess(false);
        }
        return callbackSuccess(true);
    });
};

exports.deleteVariable = function(condition) {

  return new Promise(function(resolve, reject) {
      globalDatabase.connection.use(variablesContainer).find({
          "selector": condition
      }, function(error, result) {
          if (error) {
              reject(error);
          } else if (result.docs.length === 0) {
              reject('variable not found');
          } else {
              globalDatabase.connection.use(variablesContainer).destroy(result.docs[0]._id, result.docs[0]._rev, function(err,body){
                if(err) {
                  reject(err);
                } else {
                  resolve(body);
                }
              });
          }
      })
  });
};

exports.saveVariable = function(object) {
  return new Promise(function(resolve, reject) {
    if (object._id == undefined) {
        globalDatabase.connection.use(variablesContainer).insert(object, function(err,body){
          if(err) {
            reject(err);
          } else {
            resolve(body);
          }
        });
    } else {
        globalDatabase.connection.use(variablesContainer).find({
            "selector": {
                _id: object._id
            }
        }, function(err, findResult) {
          if(err) {
            reject(err);
          } else if (findResult.docs[0] != undefined) {
                object._rev = findResult.docs[0]._rev;
            }
            globalDatabase.connection.use(variablesContainer).insert(object, function(resolve,reject){
              if(err) {
                reject(err);
              } else {
                resolve(body);
              }
            });
        });
    }
  });
};

exports.updateVariable = function(condition, object) {

  return new Promise(function(resolve, reject) {
      globalDatabase.connection.use(variablesContainer).find({
          "selector": condition
      }, function(error, findResult) {
          if (error) {
              reject(error);
          } else if (findResult.docs[0] != undefined) {
              object._id = findResult.docs[0]._id;
              object._rev = findResult.docs[0]._rev;
          }
          globalDatabase.connection.use(variablesContainer).insert(object, function(err,body){
            if(err) {
              reject(err);
            } else {
              resolve(body);
            }
          });
      });
  });
};

exports.getVariables = function(limit) {

  return new Promise(function(resolve, reject) {
    if (!limit) {
        globalDatabase.connection.use(variablesContainer).find({
            "selector": {},
            "fields": [
                "abbreviation",
                "name",
                "tooltip",
                "value"
            ]
        }, function(err, result) {
          if (err) {
            reject(err);
          } else resolve(result.docs);
        });
    } else {
        globalDatabase.connection.use(variablesContainer).find({
            "selector": {},
            "fields": [
                "abbreviation",
                "name",
                "tooltip",
                "value"
            ],
            "limit": limit
        }, function(err, result) {
          if (err) {
            reject(err);
          } else resolve(result.docs);
        });
    }
  });
};
