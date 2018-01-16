/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
// ##############################
// ## IMPORTS                  ##
// ##############################
const permissions = require('../../helper/permissions.js');
const clientsHelper = require('../../helper/clients.js');

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
  app.get('/api/clients/reload', permissions.mwHasPermission('editConfiguration'), this.reloadClients);
};

// ##############################
// ## API                      ##
// ##############################
exports.reloadClients = function(req, res) {
    clientsHelper.reloadClients(function() {
        return res.json({ reloadClients: "success" });
    }, function(errReason) {
        return res.status(500).send(errReason);
    });
};
