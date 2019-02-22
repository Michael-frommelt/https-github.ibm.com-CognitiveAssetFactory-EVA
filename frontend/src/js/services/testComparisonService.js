/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
angular.module('eva.testing').service('TestComparisonService', ['$http',
    function($http) {
        var testComparisonEndpoint = '/api/testing/comparison/';

        this.getTestRuns = function(clientId) {
            return $http.post(testComparisonEndpoint + 'getTestRuns', {
                clientId: clientId
            }).then(function(response) {
                return response.data;
            });
        };

        this.getTestComparison = function(baseRun, compareRun, clientId) {
            return $http.post(testComparisonEndpoint + 'compareRuns', {
                baseRun: baseRun,
                compareRun: compareRun,
                clientId: clientId
            }).then(function(response) {
                return response.data;
            });
        };

        this.getTestResultDetails = function(resultId, clientId) {
            return $http.post(testComparisonEndpoint + 'getTestResultDetails', {
                resultId: resultId,
                clientId: clientId
            }).then(function(response) {
                return response.data;
            });
        };
    }
]);
