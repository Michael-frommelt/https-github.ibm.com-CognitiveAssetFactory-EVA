/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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