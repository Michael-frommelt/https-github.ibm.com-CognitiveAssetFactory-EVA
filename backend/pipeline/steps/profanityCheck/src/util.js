/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var db = require('../db/db.js').getDatabase();

var profanityList = null;

exports.getProfanityList = function(callback) {
  if(profanityList == null){
    db.getProfanityList(function(result) {
      profanityList = result[0];
      delete profanityList._id;
      delete profanityList._rev;
      return callback(profanityList);
    }, function(errCode, errReason) {
      console.log("An error occurred while retrieving the profanityList: " + errReason);
      return callback(null);
    });
  } else {
    return callback(profanityList);
  }
};
