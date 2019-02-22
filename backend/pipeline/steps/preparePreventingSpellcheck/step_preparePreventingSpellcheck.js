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
    resultHolder.debug.preparePreventingSpellcheck = {};
    resultHolder.debug.preparePreventingSpellcheck.foundActionVariable = false;
    if (resultHolder.output.actions && resultHolder.output.actions.indexOf("preventSpellcheckNextInput") !== -1) {
        resultHolder.debug.preparePreventingSpellcheck.foundActionVariable = true;
        resultHolder.session.preventSpellcheck = true;
    }

    return callback(null, resultHolder);
};
