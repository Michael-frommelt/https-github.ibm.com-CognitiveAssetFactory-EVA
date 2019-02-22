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
