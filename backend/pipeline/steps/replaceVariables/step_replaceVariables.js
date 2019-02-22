/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var variableUtil = require('./src/util.js');

exports.call = function(resultHolder, callback) {
    var alreadyMentioned = [];
    var missingCounter = 0;

    resultHolder.debug.replaceVariables = {
        executed: false,
        matches: []
    };

    variableUtil.replaceAnswerExports(alreadyMentioned, missingCounter, callback, resultHolder);
};
