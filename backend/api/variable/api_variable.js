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
const permissions = require('../../helper/permissions.js');

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
    app.get('/api/variables', permissions.mwHasPermission('editVariables'), this.getVariables);
    app.post('/api/variables/:variableName', permissions.mwHasPermission('editVariables'), this.saveVariable);
    app.delete('/api/variables/:variableName', permissions.mwHasPermission('editVariables'), this.deleteVariable);
};

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
