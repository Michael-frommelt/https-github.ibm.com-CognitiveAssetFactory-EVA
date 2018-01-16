/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var rolesContainer = globalDatabase.config.containers.roles;

exports.updateRole = function(collectionName, condition, object, options) {
    return globalDatabase.connection.collections(collectionName).update(condition, object, options);
};

exports.deleteRole = function(collectionName, condition) {
    return globalDatabase.connection.collection(collectionName).deleteOne(condition);
};
