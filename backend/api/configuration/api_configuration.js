/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
// ##############################
// ## IMPORTS                  ##
// ##############################
var db = require('./db/db.js').getDatabase();

const permissions = require('../../helper/permissions.js');

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
  app.post('/api/config/get', permissions.mwHasPermission('isAuthenticated'), this.getConfig);
  app.post('/api/config/extended_feedback_config/get', permissions.mwHasPermission('isAuthenticated'), this.getExtendedFeedbackConfig);
  app.post('/api/config/update', permissions.mwHasSomePermission('editConfiguration','editSettings'), this.updateConfig);
};

// ##############################
// ## API                      ##
// ##############################
exports.updateConfig = function(req, res) {
  var id = req.body.config_id;
  var config = req.body.config_object;

  db.updateConfig(id, config, function(result) {
    res.json(result);
  }, function(errReason) {
    res.status(500).send(errReason);
  });
};

function getConfigFunction(id, callbackSuccess, callbackError) {
  db.getConfig(id, function(result) {
    return callbackSuccess(result);
  }, function(errReason) {
    return callbackError(errReason);
  });
}

exports.getConfig = function(req, res) {
  if(res !== undefined) {
    var id = req.body.config_id;
  }

  getConfigFunction(id, function(result) {
    res.json(result);
  }, function(errReason) {
    res.status(500).send(errReason);
  });
};

exports.getExtendedFeedbackConfig = function(req, res) {
  getConfigFunction("extended_feedback_config", function(result) {
    res.json(result);
  }, function(errReason) {
    res.status(500).send(errReason);
  });
};

exports.getConfigIntern = function(id, callbackSuccess, callbackError) {
  getConfigFunction(id, callbackSuccess, callbackError);
};
