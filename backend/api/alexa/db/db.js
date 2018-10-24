/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
  var db;
  if (globalDatabase.type === "mongodb") {
      db = require('./src/mongodb.js');
} else if (globalDatabase.type === "cloudant") {
    db = require('./src/cloudant.js');
} else {
      throw new Error("No database functions for globalDatabase.type = '" + globalDatabase.type + "' for module 'externalFrontend'!");
  }
  
  exports.getDatabase = function() {
      return db;
  };