/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

// ##############################
// ## IMPORTS                  ##
// ##############################
var fs = require('fs');
var moment = require('moment');
var os = require('os');
var path = require('path');

var db = require('./db/db.js').getDatabase();
var permissions = require('../../helper/permissions.js');
var clientsHelper = require('../../helper/clients.js');

var fileExportTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csv-export'));
var feedbackExportCache = {};
var conversationFeedbackExportCache = {};

const conversationsLogsContainer = globalDatabase.config.containers.conversation_logs;
const conversationFeedbackContainer = globalDatabase.config.containers.conversationFeedback;

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
  app.post('/api/feedback/save', permissions.mwHasPermission('isAuthenticated'), this.saveFeedback);

  app.post('/api/feedback/get', permissions.mwHasPermission('viewReport'), this.getFeedback);
  app.post('/api/feedback/admin/update', permissions.mwHasPermission('viewReport'), this.updateFeedbackAdmin);
  app.post('/api/feedback/admin/delete', permissions.mwHasPermission('viewReport'), this.deleteFeedbackAdmin);
  app.post('/api/feedback/distinct', permissions.mwHasPermission('viewReport'), this.distinctFeedback);
  app.post('/api/feedback/count', permissions.mwHasPermission('viewReport'), this.countFeedback);

  app.post('/api/feedback/export/generate', permissions.mwHasPermission('viewReport'), this.generateFeedbackExport);
  app.get('/api/feedback/export/cancel', permissions.mwHasPermission('viewReport'), this.cancelFeedbackExport);
  app.get('/api/feedback/export/download', permissions.mwHasPermission('viewReport'), this.downloadFeedbackExport);
  app.get('/api/feedback/export/progress', permissions.mwHasPermission('viewReport'), this.getFeedbackExportProgress);

  app.post('/api/conversation-feedback/get', permissions.mwHasPermission('viewReport'), this.getConversationFeedback);
  app.post('/api/conversation-feedback/save', permissions.mwHasPermission('isAuthenticated'), this.saveConversationFeedback);
  app.post('/api/conversation-feedback/distinctcolumnvalues', permissions.mwHasPermission('viewReport'), this.distinctColumnValuesConversation);
  app.post('/api/conversation-feedback/count', permissions.mwHasPermission('viewReport'), this.countConversationFeedback);

  app.post('/api/conversation-feedback/export/generate', permissions.mwHasPermission('viewReport'), this.generateConversationFeedbackExport);
  app.get('/api/conversation-feedback/export/cancel', permissions.mwHasPermission('viewReport'), this.cancelConversationFeedbackExport);
  app.get('/api/conversation-feedback/export/download', permissions.mwHasPermission('viewReport'), this.downloadConversationFeedbackExport);
  app.get('/api/conversation-feedback/export/progress', permissions.mwHasPermission('viewReport'), this.getConversationFeedbackExportProgress);
};

function deleteExpiredFeedbackExport() {
  var dayMillis = 24 * 60 * 60 * 1000;
  setInterval(function() {
    for (var cache of [feedbackExportCache, conversationFeedbackExportCache]) {
      for (var username in cache) {
        var exportObj = cache[username];
        if (exportObj.created + dayMillis < Date.now()) {
          fs.unlink(exportObj.filePath, function() {});
          delete cache[username];
        }
      }
    }
  }, dayMillis);
}
deleteExpiredFeedbackExport();

// ##############################
// ## API                      ##
// ##############################
function saveFeedbackLogic(session, messageId, feedback_thumbs, feedback_comment, callbackSuccess, callbackError, reason) {
  if (messageId === undefined) {
    return callbackError(500, 'messageId_not_defined');
  }

  var feedback = session.feedback[messageId];

  if (!feedback) {
    return callbackError(500, 'feedback_not_defined');
  }

  var saved = feedback.saved;
  delete feedback.saved;

  if(saved) {
    var feedbackId = feedback._id;
    var update = {};
    update.feedback = feedback_thumbs;
    update.comment = feedback_comment;
    update.reason = reason;
    update.updated = new Date().getTime();
    db.updateFeedback(feedbackId, update, function(result) {
      result.saved = true;
      session.feedback[messageId] = result;
      callbackSuccess(result);
    }, function(errCode, errReason) {
      callbackError(errCode, errReason);
    });
  } else {
    feedback.created = new Date().getTime();
    feedback.updated = new Date().getTime();
    feedback.feedback = feedback_thumbs;
    feedback.comment = feedback_comment;
    feedback.reason = reason;

    db.saveFeedback(feedback, function(result) {
      result.saved = true;
      session.feedback[messageId] = result;
      callbackSuccess(result);
    }, function(errCode, errReason) {
      callbackError(errCode, errReason);
    });
  }
}

exports.updateFeedbackAdmin = function(req, res) {
  var doc = req.body;
  var feedbackId = doc.feedbackId;
  var update = doc.update;
  update.updated = new Date().getTime();
  db.updateFeedback(feedbackId, update, function(result) {
    res.json(result);
  }, function(errCode, errReason) {
    res.status(errCode).send(errReason);
  });
};

exports.deleteFeedbackAdmin = function(req, res) {
  var doc = req.body;
  var feedbackId = doc.feedbackId;
  db.deleteFeedback(feedbackId, function() {
    res.json({success: true});
  }, function(errCode, errReason) {
    res.status(errCode).send(errReason);
  });
};

exports.saveFeedbackIntern = function(session, messageId, feedback_thumbs, callbackSuccess, callbackError) {
    saveFeedbackLogic(session, messageId, feedback_thumbs, undefined, callbackSuccess, callbackError, undefined);
};

exports.saveFeedback = function(req, res) {
  var doc = req.body;
  var clientId = doc.clientId;
  var messageId = doc.messageId;
  var feedback_thumbs = doc.feedback;
  var feedback_comment = doc.comment;
  var session = req.session[clientId].watson;
  var reason = doc.reason;

  saveFeedbackLogic(session, messageId, feedback_thumbs, feedback_comment, function(result) {
    res.json(result);
  }, function(errCode, errReason) {
    res.status(errCode).send(errReason);
  }, reason);
};

exports.saveFeedbackExternal = function(session, message_id, feedback_thumbs, feedback_comment, callbackSuccess, callbackError) {
  saveFeedbackLogic(session.watson, message_id, feedback_thumbs, feedback_comment, callbackSuccess, callbackError);
};

exports.countFeedback = function(req, res) {
  var clients = clientsHelper.getUserClients(req.user,true,false);

  var clientNames = [];

  clients.forEach( function(client) {
    clientNames.push(client.id);
  });

  var clientFilter = { 
    value:{$in: clientNames},
    type: 'system'
  };

  var filter = {};

  if(req.body.filter) {
    filter = req.body.filter;
  }

  if(filter.clientId && filter.clientId !== undefined) {
    if(!clientNames.indexOf(filter.clientId)) {
      filter.clientId = clientFilter;
    }
  } else {
    filter.clientId = clientFilter;
  }


  db.countFeedback(conversationsLogsContainer, filter, function(result) {
    res.json(result);
  }, function(errCode, errReason) {
    res.status(errCode).send(errReason);
  });
};

exports.distinctFeedback = function(req, res) {
  var clients = clientsHelper.getUserClients(req.user);
  var clientNames = [];
  for (let client of clients) {
    clientNames.push(client.id);
  }
  var columnId = req.body.columnId;
  if(columnId) {
    db.distinctFeedback(conversationsLogsContainer, columnId, function(result) {
      
      if(columnId == 'clientId') {
        var resultToSend = [];
        for (let name of clientNames) {
          if (result.indexOf(name) !== -1) {
            resultToSend.push(name);
          } 
        }
        res.json(resultToSend);
      } else {
        res.json(result);
      }
      
    }, function(errCode, errReason) {
      res.status(errCode).send(errReason);
    });
  } else {
    return res.status(404).send("columnId_not_set");
  }
};

exports.getFeedback = function(req, res) {
  var documents = [];

  var clients = clientsHelper.getUserClients(req.user,true,false);

  var clientNames = [];

  clients.forEach( function(client) {
    clientNames.push(client.id);
  });

  var clientFilter = { 
    value:{$in: clientNames},
    type: 'system'
  };

  var filter = {};

  if(req.body.filter) {
    filter = req.body.filter;
  }

  if(filter.clientId && filter.clientId !== undefined) {
    if(!clientNames.indexOf(filter.clientId)) {
      filter.clientId = clientFilter;
    }
  } else {
    filter.clientId = clientFilter;
  }

  var limit = 0;
  if(req.body.limit) {
    limit = parseInt(req.body.limit);
  }

  var page = 1;
  if(req.body.page) {
    page = parseInt(req.body.page);
  }

  var sorting = {};
  if(req.body.sorting) {
    sorting = req.body.sorting;
  }

  db.getFeedback(conversationsLogsContainer, filter, limit, page, sorting, function(results) {
    results.forEach(function(document) {
      var entitiesAsString = "";
      for(var index in document.entities) {
        if(entitiesAsString.length > 0) {
          entitiesAsString = entitiesAsString + ", ";
        }
        entitiesAsString = entitiesAsString + document.entities[index].entity + ":" + document.entities[index].value;
      }
      document.entityString = entitiesAsString;
      documents.push(document);
    });

    res.json(documents);
  }, function(errCode, errReason) {
    res.status(errCode).send("Error fetching data from Database: " + errReason);
  });
};

exports.generateFeedbackExport = function(req, res) {
  var username = req.user.username;
  var clients = clientsHelper.getUserClients(req.user,true,false);
  
  var clientNames = [];
  
  clients.forEach( function(client) {
    clientNames.push(client.id);
  });
  
  var clientFilter = { 
    value:{$in: clientNames},
    type: 'system'
  };
  
  var filter = {};
  
  if(req.body.filter) {
    filter = req.body.filter;
  }
  
  if(filter.clientId && filter.clientId !== undefined) {
    if(!clientNames.indexOf(filter.clientId)) {
      filter.clientId = clientFilter;
    }
  } else {
    filter.clientId = clientFilter;
  }
  
  var sorting = null; // disabled sorting due to MongoDB rejection when out of RAM, happens for large amounts of data?

  if (feedbackExportCache[username]) {
    fs.unlink(feedbackExportCache[username].filePath, function() {});
    delete feedbackExportCache[username];
  }

  exportToCSV(conversationsLogsContainer, filter, sorting,
    ['conversationId', 'messageId', 'clientId', 'username', 'question', 'originalQuestion', 'answer', 'longAnswerId',
      'answerFrom', 'created', 'updated', 'feedback', 'comment', 'reason'],
    function(document, propertyNames) {
      var propertyStrings = propertyNames.map(function(propertyName) {
        if (!document.hasOwnProperty(propertyName) || document[propertyName] == null) return null;
        if (propertyName === 'longAnswerId' && Array.isArray(document.longAnswerId)) {
          return document.longAnswerId.join(', ');
        }

        if (propertyName === 'entities' && Array.isArray(document.entities)) {
          var entityStrings = document.entities.map(function(entity) {
            return entity.entity + ': ' + entity.value;
          });
          return entityStrings.join(', ');
        }

        if ((propertyName === 'created' || propertyName === 'updated') && typeof document[propertyName] === 'number') {
          var dateObject = moment(document[propertyName]);
          return dateObject.format('YYYY-MM-DD HH:mm:ss');
        }

        var stringValue = String(document[propertyName]);
        stringValue = stringValue.replace(/\n/g, '\\n').replace(/\r/g, '\\r');

        if (stringValue.indexOf(';') > 0) {
          // Escape double quotes be writing two double quotes and enclose the string in double quotes to escape the delimiter
          stringValue = stringValue.replace(/"/g, '""');
          stringValue = '"' + stringValue + '"';
        }
        return stringValue;
      });
      return propertyStrings.join(';');
    }
  ).then(function(cacheObject) {
    feedbackExportCache[username] = cacheObject;
    res.status(204).end();
  }, function(error) {
    res.status(500).send(error.message);
  });
};

exports.getFeedbackExportProgress = function(req, res) {
  var exportObj = feedbackExportCache[req.user.username];

  if (exportObj == null) {
    res.status(404).end();
  } else if (exportObj.error) {
    res.status(500).send(exportObj.error.message);
  } else {
    res.send({
      progress: exportObj.progress
    });
  }
};

exports.cancelFeedbackExport = function(req, res) {
  var exportObj = feedbackExportCache[req.user.username];

  if (exportObj == null) {
    res.status(404).end();
  } else {
    exportObj.canceled = true;
    res.status(204).end();
  }
};

exports.downloadFeedbackExport = function(req, res) {
  var exportObj = feedbackExportCache[req.user.username];

  if (exportObj == null || exportObj.created == null) {
    res.status(404).end();
  } else {
    res.download(exportObj.filePath, 'EVA_Feedback_Export_' + moment(exportObj.created).format('YYYY_MM_DD_HH:mm') + '.csv');
  }
};

exports.getConversationFeedback = function(req, res) {
  var clients = clientsHelper.getUserClients(req.user,true,false);

  var clientNames = [];

  clients.forEach( function(client) {
    clientNames.push(client.id);
  });

  var clientFilter = { 
    value:{$in: clientNames},
    type: 'system'
  };

  var filter = {};

  if(req.body.filter) {
    filter = req.body.filter;
  }

  if(filter.clientId && filter.clientId !== undefined) {
    if(!clientNames.indexOf(filter.clientId)) {
      filter.clientId = clientFilter;
    }
  } else {
    filter.clientId = clientFilter;
  }

  const limit = req.body.limit ? parseInt(req.body.limit) : 0;
  const page = req.body.page ? parseInt(req.body.page) : 1;
  const sorting = req.body.sorting || {};

  db.getFeedback(conversationFeedbackContainer, filter, limit, page, sorting, function(documents) {
    res.json(documents);
  }, function(errCode, errReason) {
    res.status(errCode || 500).send(errReason);
  });
};

exports.saveConversationFeedback = function(req, res) {
  const clientId = req.body.clientId;
  if (!(req.session[clientId] && req.session[clientId].watson &&
    typeof req.session[clientId].watson.conversationId === 'string')) {
    return res.status(400).send('Missing_conversation_id_in_session');
  }
  const conversationId = req.session[clientId].watson.conversationId;

  saveConversationFeedbackInternal(clientId, req.body.comment, conversationId, req.body.rating, req.user.username, function() {
    res.status(204).end();
  }, function(error) {
    res.status(500).send(error.message);
  });
};

exports.saveConversationFeedbackExternal = function(clientId, comment, conversationId, rating, username, successCallback, errorCallback) {
  saveConversationFeedbackInternal(clientId, comment, conversationId, rating, username, successCallback, errorCallback);
};

function saveConversationFeedbackInternal(clientId, comment, conversationId, rating, username, successCallback, errorCallback) {
  const conversationFeedback = {
    clientId: clientId,
    comment: comment,
    conversationId: conversationId,
    created: new Date(),
    rating: rating,
    username: username,
  };

  db.saveConversationFeedbackInternal(conversationFeedbackContainer, conversationFeedback).then(function() {
    successCallback();
  }, function(error) {
    errorCallback(error);
  });
}

exports.distinctColumnValuesConversation = function(req, res) {
  if (!req.body.columnName) {
    return res.status(400).send('columnName_not_set');
  }

  var clients = clientsHelper.getUserClients(req.user);
  var clientNames = [];
  for (let client of clients) {
    clientNames.push(client.id);
  }
  var columnName = req.body.columnName;

  db.distinctFeedback(conversationFeedbackContainer, columnName, function(result) {
    if(columnName == 'clientId') {
      var resultToSend = [];
      for (let name of clientNames) {
        if (result.indexOf(name) !== -1) {
          resultToSend.push(name);
        } 
      }
      res.json(resultToSend);
    } else {
      res.json(result);
    }
  }, function(errCode, errReason) {
    res.status(errCode || 500).send(errReason);
  });
};

exports.countConversationFeedback = function(req, res) {
  var clients = clientsHelper.getUserClients(req.user,true,false);

  var clientNames = [];

  clients.forEach( function(client) {
    clientNames.push(client.id);
  });

  var clientFilter = { 
    value:{$in: clientNames},
    type: 'system'
  };

  var filter = {};

  if(req.body.filter) {
    filter = req.body.filter;
  }

  if(filter.clientId && filter.clientId !== undefined) {
    if(!clientNames.indexOf(filter.clientId)) {
      filter.clientId = clientFilter;
    }
  } else {
    filter.clientId = clientFilter;
  }

  db.countFeedback(conversationFeedbackContainer, filter, function(result) {
    res.json(result);
  }, function(errCode, errReason) {
    res.status(errCode || 500).send(errReason);
  });
};

exports.generateConversationFeedbackExport = function(req, res) {
  var username = req.user.username;

  var clients = clientsHelper.getUserClients(req.user,true,false);

  var clientNames = [];

  clients.forEach( function(client) {
    clientNames.push(client.id);
  });

  var clientFilter = { 
    value:{$in: clientNames},
    type: 'system'
  };

  var filter = {};

  if(req.body.filter) {
    filter = req.body.filter;
  }

  if(filter.clientId && filter.clientId !== undefined) {
    if(!clientNames.indexOf(filter.clientId)) {
      filter.clientId = clientFilter;
    }
  } else {
    filter.clientId = clientFilter;
  }

  var sorting = null; // disabled sorting due to MongoDB rejection when out of RAM, happens for large amounts of data?

  if (conversationFeedbackExportCache[username]) {
    fs.unlink(conversationFeedbackExportCache[username].filePath, function() {});
    delete conversationFeedbackExportCache[username];
  }

  exportToCSV(conversationFeedbackContainer, filter, sorting,
    ['conversationId', 'clientId', 'username', 'created', 'rating', 'comment'],
    function(document, propertyNames) {
      var propertyStrings = propertyNames.map(function(propertyName) {
        if (!document.hasOwnProperty(propertyName) || document[propertyName] == null) return null;

        if (propertyName === 'created') {
          var dateObject = moment(document[propertyName]);
          return dateObject.format('YYYY-MM-DD HH:mm:ss');
        }

        var stringValue = String(document[propertyName]);
        stringValue = stringValue.replace(/\n/g, '\\n').replace(/\r/g, '\\r');

        if (stringValue.indexOf(';') > 0) {
          // Escape double quotes be writing two double quotes and enclose the string in double quotes to escape the delimiter
          stringValue = stringValue.replace(/"/g, '""');
          stringValue = '"' + stringValue + '"';
        }
        return stringValue;
      });
      return propertyStrings.join(';');
    }
  ).then(function(cacheObject) {
    conversationFeedbackExportCache[username] = cacheObject;
    res.status(204).end();
  }, function(error) {
    res.status(500).send(error.message);
  });
};

exports.getConversationFeedbackExportProgress = function(req, res) {
  var exportObj = conversationFeedbackExportCache[req.user.username];

  if (exportObj == null) {
    res.status(404).end();
  } else if (exportObj.error) {
    res.status(500).send(exportObj.error.message);
  } else {
    res.send({
      progress: exportObj.progress
    });
  }
};

exports.cancelConversationFeedbackExport = function(req, res) {
  var exportObj = conversationFeedbackExportCache[req.user.username];

  if (exportObj == null) {
    res.status(404).end();
  } else {
    exportObj.canceled = true;
    res.status(204).end();
  }
};

exports.downloadConversationFeedbackExport = function(req, res) {
  var exportObj = conversationFeedbackExportCache[req.user.username];

  if (exportObj == null || exportObj.created == null) {
    res.status(404).end();
  } else {
    res.download(exportObj.filePath, 'EVA_Conversation_Feedback_Export_' + moment(exportObj.created).format('YYYY_MM_DD_HH:mm') + '.csv');
  }
};

function exportToCSV(containerName, filter, sorting, propertyNames, documentToCSVFormatter) {
  var filePath = path.join(fileExportTempDir, 'export' + Date.now() + '.csv');

  return new Promise(function(resolve, reject) {
    fs.open(filePath, fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_RDWR, function(error, fileDescriptor) {
      if (error) return reject(error);

      db.countFeedback(containerName, filter, function(feedbackCount) {
        var cacheObject = {
          canceled: false,
          created: null,
          filePath: filePath,
          progress: 0,
        };
        var feedbackStream = db.getFeedbackStream(containerName, filter, sorting);
        var writer = fs.createWriteStream('', {fd: fileDescriptor, encoding: 'utf8'});
        var processedCounter = 0;

        writer.on('error', function(error) {
          feedbackStream.destroy();
          cacheObject.canceled = true;
          cacheObject.error = error;
        });

        writer.write(propertyNames.join(';') + '\n');

        feedbackStream.on('data', function(feedbackDocument) {
          if (cacheObject.canceled) {
            feedbackStream.close();
            return;
          }
          processedCounter += 1;

          writer.write(documentToCSVFormatter(feedbackDocument, propertyNames) + '\n');
          cacheObject.progress = Math.round(processedCounter * 100 / feedbackCount);
        });

        feedbackStream.on('error', function(error) {
          feedbackStream.destroy();
          cacheObject.canceled = true;
          cacheObject.error = error;
        });

        feedbackStream.once('end', function() {
          writer.end();
          if (cacheObject.canceled) {
            fs.unlink(filePath, function() {});
          } else {
            cacheObject.progress = 100;
            cacheObject.created = Date.now();
          }
        });

        resolve(cacheObject);
      }, function(error) {
        reject(error);
      });
    });
  });
}
