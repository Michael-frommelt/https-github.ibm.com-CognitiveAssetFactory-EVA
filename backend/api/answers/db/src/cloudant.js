/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

var dbconfig = globalDatabase.config;
const configContainer = globalDatabase.config.containers.config;

exports.deleteExpiredVersions = function(containerName, expirationTime) {

  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(containerName).find({
      "selector": {
        markedForDeletionTime: {
          $lt: expirationTime
        }
      }
    }, function(error, body) {
      if (error) {
        reject(error);
      } else {
        body.docs.forEach(function(doc, index) {
          globalDatabase.connection.use(containerName).destroy(doc._id, doc._rev, function(err, body) {
            if (err) {
              reject(err);
            } else {
              resolve(body);
            }
          });
        });
      }
    })
  });
};

exports.getConfigPromise = function(configId) {

  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(configContainer).find({
      "selector": {
        "id": configId
      }
    }, function(error, result) {
      if (error) {
        reject(error);
      } else if (result.docs.length === 0) {
        reject('answer not found');
      } else {
        resolve(result.docs);
      }
    })
  });
};

exports.getAnswer = function(containerName, answerId) {

  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(containerName).find({
      "selector": {
        "answerId": answerId
      }
    }, function(error, result) {
      if (error) {
        reject(error);
      } else if (result.docs.length === 0) {
        resolve(null);
      } else {
        delete result.docs[0]._id;
        delete result.docs[0]._rev;
        resolve(result.docs[0]);
      }
    });
  });
};

exports.upsertAnswer = function(containerName, answerId, answerObject, override) {

  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(containerName).find({
      "selector": {
        "answerId": answerId
      }
    }, function(err, result) {
      var inserted = {
        inserted: 1,
        modified: 0
      };
      var modified = {
        inserted: 0,
        modified: 1
      };
      var noAction = {
        inserted: 0,
        modified: 0
      };
      if (err) {
        resolve(noAction);
      } else if (result.docs[0] === undefined) {
        globalDatabase.connection.use(containerName).insert(answerObject, function(err, insertResult) {
          if (err) {
            resolve(noAction);
          }
          resolve(inserted);
        });
      } else if (override === true) {
        answerObject._rev = result.docs[0]._rev;
        answerObject._id = result.docs[0]._id;
        globalDatabase.connection.use(containerName).insert(answerObject, function(err) {
          if (err) {
            resolve(noAction);
          }
          resolve(modified);
        });
      } else resolve(noAction);
    })
  });
};

exports.upsertVersion = function(containerName, answerId, versionDocument, limit) {

  return new Promise(function(resolve, reject) {
    var origDoc;
    globalDatabase.connection.use(containerName).find({
      "selector": {
        "answerId": answerId
      }
    }, function(err, versionsDocument) {
      if (err) {
        reject(err);
      } else {
        versionDocument.number = 1;
        if (versionsDocument.docs[0] && Array.isArray(versionsDocument.docs[0].versions) && typeof versionsDocument.docs[0].versions[0].number === 'number') {
          origDoc = versionsDocument.docs[0];
          versionDocument.number = versionsDocument.docs[0].versions[0].number + 1;
        }
        if (origDoc !== undefined) {
          origDoc.versions.unshift(versionDocument);
          origDoc.versions = origDoc.versions.slice(0, limit);
          globalDatabase.connection.use(containerName).insert(origDoc, function(err, body) {
            if (err) {
              reject(err);
            } else {
              resolve(body);
            }
          });
        } else {
          var newDoc = {
            answerId: answerId,
            versions: [versionDocument]
          }
          globalDatabase.connection.use(containerName).insert(newDoc, function(err, body) {
            if (err) {
              reject(err);
            } else {
              resolve(body);
            }
          });
        }
      }
    });
  })
};

exports.deleteAnswer = function(containerName, answerId) {

  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(containerName).find({
      "selector": {
        "answerId": answerId
      }
    }, function(err, body) {
      if (err) {
        reject(err);
      } else {
        globalDatabase.connection.use(containerName).destroy(body.docs[0]._id, body.docs[0]._rev, function(err, body) {
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

exports.markVersionForDeletion = function(containerName, answerId) {

  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(containerName).find({
      "selector": {
        "answerId": answerId
      }
    }, function(err, body) {
      if (err) {
        reject(err);
      } else {
        var object = body.docs[0];
        object.markedForDeletion = true;
        object.markedForDeletionTime = new Date();
        globalDatabase.connection.use(containerName).insert(object, function(err, body) {
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

exports.unmarkVersionForDeletion = function(containerName, answerId) {

  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(containerName).find({
      "selector": {
        "answerId": answerId
      }
    }, function(err, body) {
      if (err) {
        reject(err)
      } else {
        var object = body.docs[0];
        if (object.markedForDeletion !== undefined) {
          delete object.markedForDeletion;
        }
        if (object.markedForDeletionTime !== undefined) {
          delete object.markedForDeletionTime;
        }
        globalDatabase.connection.use(containerName).insert(object, function(err, body) {
          if (err) {
            reject(err);
          } else {
            resolve(body);
          }
        });
      }
    })
  })
};

exports.getVersions = function(containerName, answerId) {

  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(containerName).find({
      "selector": {
        "answerId": answerId
      },
      "fields": [
        "versions"
      ]
    }, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.docs[0]);
      }
    });
  });
};

exports.getVersionsMarkedForDeletion = function(containerName) {

  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(containerName).find({
      "selector": {
        "markedForDeletion": true
      },
      "fields": [
        "versions"
      ]
    }, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.docs[0]);
      }
    });
  });
};

exports.upsertAnswerProperty = function(propertyName, answerProperty) {

  return new Promise(function(resolve, reject) {
    console.log("upsertAnswerProperty", answerProperty);
    globalDatabase.connection.use(configContainer).find({
      "selector": {
        "id": 'answerStore',
        "answerProperties": {
          "$elemMatch": {
            "name": {
              "$eq": propertyName
            }
          }
        }
      }
    }, function(err, findResult) {
      if (err) {
        reject(err);
      }
      if (findResult.docs[0] != undefined) {
        var answerPropArray = findResult.docs[0].answerProperties[0];
        for (var prop in answerProperty) {
          answerPropArray[prop] = answerProperty[prop];
        }
        findResult.docs[0].answerProperties[0] = answerPropArray;
        globalDatabase.connection.use(configContainer).insert(findResult.docs[0], function(err, body) {
          if (err) {
            reject(err);
          } else {
            resolve(body);
          }
        });
      } else {
        globalDatabase.connection.use(configContainer).find({
          "selector": {
            "id": 'answerStore',
          }
        }, function(err, result) {
          if (err) {
            reject(err);
          } else if (result.docs[0] != undefined) {
            result.docs[0].answerProperties.push(answerProperty);
            globalDatabase.connection.use(configContainer).insert(result.docs[0], function(err, body) {
              if (err) {
                reject(err);
              } else {
                resolve(body);
              }
            });
          } else {
            console.log("answerPropertiesId does not exist!")
            reject();
          }
        });
      }
    });
  });
};

exports.deleteAnswerProperty = function(answerPropertiesId, propertyName) {

  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(configContainer).find({
      "selector": {
        "id": answerPropertiesId
      }
    }, function(err, body) {
      if (err) {
        reject(err);
      }
      var object = body.docs[0];
      delete object[propertyName];
      globalDatabase.connection.use(configContainer).insert(object, function(err, body) {
        if (err) {
          reject(err);
        } else {
          resolve(body);
        }
      });
    });
  });
};


exports.getAnswers = function(containerName, limit) {

  return new Promise(function(resolve, reject) {
    if (!limit) {
      globalDatabase.connection.use(containerName).find({
        "selector": {}
      }, function(err, result) {
        if (err) {
          reject(err);
        }
        for (doc of result.docs) {
          delete doc._id;
          delete doc._rev;
        }
        resolve(result.docs);
      });
    } else {
      globalDatabase.connection.use(containerName).find({
        "selector": {},
        "limit": limit
      }, function(err, result) {
        if (err) {
          reject(err);
        }
        for (doc of result.docs) {
          delete doc._id;
          delete doc._rev;
        }
        resolve(result.docs);
      });
    }
  });
};
