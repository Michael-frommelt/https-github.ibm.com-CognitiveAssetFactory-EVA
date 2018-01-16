/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var db = require('../db/db.js').getDatabase();

var profanityList = null;

exports.getProfanityList = function(callback) {
  if(profanityList == null){
    db.getProfanityList(function(result) {
      profanityList = result[0];
      delete profanityList._id;
      return callback(profanityList);
    }, function(errCode, errReason) {
      console.log("An error occurred while retrieving the profanityList: " + errReason);
      return callback(null);
    });
  } else {
    return callback(profanityList);
  }
};
