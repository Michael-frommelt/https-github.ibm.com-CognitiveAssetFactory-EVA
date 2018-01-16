/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var rolesContainer = globalDatabase.config.containers.roles;

exports.updateRole = function(containerName, roleId, object, upsert) {
    var updateObject = object["$set"];

    return new Promise(function(resolve,reject) {
      globalDatabase.connection.use(containerName).find({
        "selector": {
            "id": roleId.id
        }
      },function(err, result) {
        if(err) {
          reject(err);
        } else if (result.docs.length == 0 && upsert["upsert"] == true) {
            globalDatabase.connection.use(containerName).insert(updateObject, function(err, body) {
              if (err) {
                reject(err);
              } else {
                resolve(body);
              }
            })
        } else {
            updateObject._id = result.docs[0]._id;
            updateObject._rev = result.docs[0]._rev;
            globalDatabase.connection.use(containerName).insert(updateObject, function(err, body) {
              if (err) {
                reject(err);
              } else {
                resolve(body);
              }
            })
        }
      });
    });
};

exports.deleteRole = function(containerName, condition) {

    return new Promise(function(resolve,reject) {
      globalDatabase.connection.use(containerName).find({
          "selector": condition
      },function(err, result) {
        if(err) {
          reject(err);
        } else if (result.docs[0] != undefined) {
              globalDatabase.connection.use(containerName).destroy(result.docs[0]._id, result.docs[0]._rev, function(err, body) {
                if (err) {
                  reject(err);
                } else {
                  resolve(body);
                }
              });
          }
      });
    });
};
