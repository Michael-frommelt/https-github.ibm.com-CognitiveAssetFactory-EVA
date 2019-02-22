/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
const variablesContainer = globalDatabase.config.containers.variables;

exports.findVariable = function(match, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(variablesContainer).find({
        name: match.match[1]
    }).toArray(function(err, result) {
        if (err) {
            return callbackError(err);
        } else {
            return callbackSuccess(result);
        }
    });
};
