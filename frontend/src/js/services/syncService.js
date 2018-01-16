/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main').service('SyncService', ['$http', 
  function($http) {
    var syncEndpoint = '/api/sync/';
    
    this.getAnswerIdDifference = function(clientId) {
      return $http.get(syncEndpoint + 'answerids/' + clientId).then(function(getResult) {
        var differenceObject = getResult.data;
        return differenceObject;
      });
    };

    this.getVariablesDifference = function(clientId) {
      return $http.get(syncEndpoint + 'variables/' + clientId).then(function(getResult) {
        var differenceObject = getResult.data;
        return differenceObject;
      });
    };
  }
]);