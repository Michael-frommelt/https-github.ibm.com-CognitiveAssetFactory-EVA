/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
const profanityContainer = globalDatabase.config.containers.profanityList;

exports.getProfanityList = function(callbackSuccess, callbackError) {
    globalDatabase.connection.use(profanityContainer).find({
        "selector" : {}
    }, function(err, result) {
        if (err) {
            console.log(err);
            return callbackError('db_connection_error');
        }
        return callbackSuccess(result.docs);
    });
};
