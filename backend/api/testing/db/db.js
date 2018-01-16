/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var db;
if (globalDatabase.type === "mongodb") {
    db = {
        CONFUSION: require('./src/confusion/mongodb.js'),
        DIALOG: require('./src/dialog/mongodb.js'),
        KFOLD: require('./src/kfold/mongodb.js'),
        TABLEVIEW: require('./src/tableview/mongodb.js'),
        TESTCASES: require('./src/testcases/mongodb.js'),
        TESTCOMPARISON: require('./src/testComparison/mongodb.js')
    };
} else if (globalDatabase.type === "cloudant") {
    db = {
        CONFUSION: require('./src/confusion/cloudant.js'),
        DIALOG: require('./src/dialog/cloudant.js'),
        KFOLD: require('./src/kfold/cloudant.js'),
        TABLEVIEW: require('./src/tableview/cloudant.js'),
        TESTCASES: require('./src/testcases/cloudant.js'),
        TESTCOMPARISON: require('./src/testComparison/cloudant.js')
    };
} else {
    throw new Error("No database functions for globalDatabase.type = '" + globalDatabase.type + "' for module 'testing'!");
}

exports.getDatabase = function() {
    return db;
};
