/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
globalDatabase.type = process.env.DB_TYPE ? process.env.DB_TYPE : null;

var db;
if (globalDatabase.type === "mongodb") {
    db = require('./src/mongodb.js');
} else if (globalDatabase.type === "cloudant") {
    db = require('./src/cloudant.js');
} else if (globalDatabase.type === null) {
    throw new Error("Database type not defined. Please define DB_TYPE in the user-provided environment variables.");
} else {
    throw new Error("Database type '" + globalDatabase.type + "' not found!");
}

exports.getDatabase = function() {
    return db;
};
