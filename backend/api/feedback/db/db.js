/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var db;
if (globalDatabase.type === "mongodb") {
    db = require('./src/mongodb.js');
} else if (globalDatabase.type === "cloudant") {
    db = require('./src/cloudant.js');
} else {
    throw new Error("No database functions for globalDatabase.type = '" + globalDatabase.type + "' for module 'feedback'!");
}

exports.getDatabase = function() {
    return db;
};
