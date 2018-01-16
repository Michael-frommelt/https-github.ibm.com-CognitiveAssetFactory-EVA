/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
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
