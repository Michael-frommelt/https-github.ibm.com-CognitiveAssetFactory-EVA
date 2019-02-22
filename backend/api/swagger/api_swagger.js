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
const fs = require('fs');
const express = require('express');
const pathToSwaggerUi = require('swagger-ui-dist').absolutePath();

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
  app.get('/api/swagger', this.sendIndex);
  app.get('/api/swagger/index.html', this.sendIndex);
  app.get('/api/swagger/swagger.json', this.sendSwaggerFile);
  app.get('/api/swagger/\*', this.sendSwaggerUI);
};

// ##############################
// ## API                      ##
// ##############################
exports.sendIndex = function(req, res) {
  res.sendFile(`${__dirname}/swagger.html`);
};

exports.sendSwaggerFile = function(req, res) {
  res.sendFile(`${__dirname}/external_api.json`);
};

exports.sendSwaggerUI = function(req, res, next) {
  // Strip /api/swagger from url so serve-statics path finding works correctly
  if (req.url.startsWith('/api/swagger')) req.url = req.url.substring('/api/swagger'.length);
  
  express.static(pathToSwaggerUi, {
    fallthrough: false,
  })(req, res, next);
};
