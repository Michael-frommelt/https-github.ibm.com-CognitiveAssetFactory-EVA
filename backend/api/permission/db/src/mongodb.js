/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var rolesContainer = globalDatabase.config.containers.roles;

exports.updateRole = function(collectionName, condition, object, options) {
    return globalDatabase.connection.collections(collectionName).update(condition, object, options);
};

exports.deleteRole = function(collectionName, condition) {
    return globalDatabase.connection.collection(collectionName).deleteOne(condition);
};
