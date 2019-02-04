/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
'use strict';

// ##############################
// ## IMPORTS                  ##
// ##############################
const db = require('./db/db.js').getDatabase();
const importExportApi = require('./api_import_export.js');
const permissions = require('../../helper/permissions.js');
const multer = require('multer');
const answerStoreConfig = require('../../helper/config.js').getConfig('answerStore');
var async = require('async');



var importInProgress = false;
var importResults = [];
var importErrors = [];
var importVariablesLength = 0;
let uploader = null;

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
    app.post('/api/variables/import', permissions.mwHasPermission('editVariables'), this.importVariables);
    app.get('/api/variables/export', permissions.mwHasPermission('editVariables'), this.exportVariables);
    app.get('/api/variables', permissions.mwHasPermission('editVariables'), this.getVariables);
    app.post('/api/variables/:variableName', permissions.mwHasPermission('editVariables'), this.saveVariable);
    app.delete('/api/variables/:variableName', permissions.mwHasPermission('editVariables'), this.deleteVariable);
};

var init = () => {
    
      // setup file uploader with file size limit
      uploader = multer({
        storage: multer.memoryStorage(),
        limits: {
          fileSize: answerStoreConfig.fileSizeLimit * 1024 || 20480 * 1024
        } // default: 20MB
      }).single('uploadFile');
    };
    init();

// ##############################
// ## REST API                 ##
// ##############################
exports.getVariables = function(req, res) {
    getVariablesInternal(req.query.limit).then(function(answers) {
        res.json(answers);
    }, function(error) {
        res.status(error.status || 500).send(error.message);
    });
};

exports.saveVariable = function(req, res) {
    if (!req.body) {
        return res.status(400).json({
            code: "request_body_missing"
        });
    }

    var update = req.body.update;

    if (!req.body.variable) {
        return res.status(400).json({
            code: "no_variable_given"
        });
    }

    var variable = req.body.variable;

    if (!update) {
        return db.checkVariableUniqueness(variable.name, function(variableUnique) {
            if (!variableUnique) {
                console.log("Variable already exists");
                return res.status(500).json({
                    code: "variable_already_exists"
                });
            }

            return db.saveVariable(variable).then(function() {
                return res.status(204).end();
            }, function(error) {
                console.log("There was an error creating the variable " + variable.name + ": " + error);
                return res.status(error.status || 500).send(error.message);
            });
        }, function(errCode, errReason) {
            console.log("There was an error creating the variable: " + errReason);
            return res.status(errCode).json(errReason);
        });
    } else {
        return db.updateVariable({
            name: variable.name
        }, variable).then(function(result) {
            return res.json(result);
        }, function(error) {
            console.log("There was an error updating the variable " + variable.name + ": " + error);
            return res.status(error.status || 500).send(error.message);
        });
    }
};

exports.deleteVariable = function(req, res) {
    return db.deleteVariable({
        name: req.params.variableName
    }).then(function() {
        res.status(204).end();
    }, function(error) {
        res.status(error.status || 500).send(error.message);
    });
};

function getVariablesInternal(limit) {
    return db.getVariables(limit || null);
};
exports.getVariablesInternal = getVariablesInternal;


exports.exportVariables = function(req, res) {
  db.getVariables()
    .then(variables => {
      return importExportApi.exportVariables(variables, req.query.lang, req.query.type);
    }).then(download => {
      res.attachment(download.filename);
      res.send(download.buffer);
    }, error => res.status(error.status || 500).send(error.message));
};

exports.importVariables = function(req, res) {
  const override = req.query.hasOwnProperty('override') && req.query.override == 'true';
  importResults = [];
  importErrors = [];
  importVariablesLength = 0;

  if (!uploader) {
    return res.status(500).send('VariableStore_file_uploader_is_not_set_up');
  }
  uploader(req, res, error => {
    if (error) {
      importInProgress = false;
      return res.status(error.status || 500).send(error.message);
    }
    return importExportApi.importVariables(req.file.buffer).
      then(function(variables) {
        const variablesArray = Array.from(variables);
        importInProgress = true;
        importVariablesLength = variablesArray.length;

        async.forEachLimit(variablesArray, 25, function(variable, callback) {
          db.upsertVariable( variable, override).then(promiseResult => {
            importResults.push(promiseResult);
          }).then(() => callback());
        });       
        return res.status(200).send({
          importRunning: true,
        });
      }).catch(function(error) {
        importInProgress = false;
        return res.status(error.status || 500).send(error.message);
      });

  });
};


exports.getImportStatus = function(req, res) {

  if (importInProgress) {
    const currentProgress = ((importResults.length + importErrors.length) * 100 / importVariablesLength).toFixed(2);

    if (currentProgress >= 100) {
      res.status(200).send({
        importRunning: false,
        finishedImport: true,
        errors: importErrors,
      });
      importInProgress = false;
      importResults = [];
      importErrors = [];
      return;
    } else {
      return res.status(200).send({
        importRunning: true,
        importProgress: currentProgress,
      });
    }
  } else {
    return res.status(200).send({
      importRunning: false
    });
  }
};