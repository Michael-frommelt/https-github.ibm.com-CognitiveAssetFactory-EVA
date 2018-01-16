/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
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
