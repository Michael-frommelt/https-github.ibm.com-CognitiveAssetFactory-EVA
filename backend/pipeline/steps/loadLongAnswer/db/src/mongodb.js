/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const configContainer = globalDatabase.config.containers.config;

exports.getAnswer = function(containerName, answerId) {
    return globalDatabase.connection.collection(containerName).findOne({
        answerId: answerId
    }, {
        _id: 0
    });
};
