/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
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
