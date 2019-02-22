/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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
