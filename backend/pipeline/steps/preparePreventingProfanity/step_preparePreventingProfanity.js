/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
exports.call = function(resultHolder, callback) {
    resultHolder.debug.preparePreventingProfanity = {};
    resultHolder.debug.preparePreventingProfanity.foundActionVariable = false;
    if (resultHolder.output.actions && resultHolder.output.actions.indexOf("preventProfanityNextInput") !== -1) {
        resultHolder.debug.preparePreventingProfanity.foundActionVariable = true;
        resultHolder.session.preventProfanity = true;
    }

    return callback(null, resultHolder);
};
