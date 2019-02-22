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
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
    require('./src/confusion.js').createRoutes(app);
    require('./src/dialog.js').createRoutes(app);
    require('./src/kfold.js').createRoutes(app);
    require('./src/tableview.js').createRoutes(app);
    require('./src/testcases.js').createRoutes(app);
    require('./src/testComparison.js').createRoutes(app);
};
