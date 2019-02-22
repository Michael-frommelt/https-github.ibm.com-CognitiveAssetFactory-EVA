/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

angular.module('eva.testing').controller('TestComparisonCtrl', ['$scope', '$q', '$http', '$uibModal', 'TestComparisonService',
    function($scope, $q, $http, $uibModal, TestComparisonService) {
        $scope.isLoading = true;
        $scope.runDates;
        $scope.clientSelection = {};
        $scope.clientSelection.availableClients = [];
        $scope.disableClientChange = false;

        var getClients = function() {
            $scope.isLoading = true;
            $http({
                method: "POST",
                url: '/api/user/getClientsForUser/true/false'
            }).then(function(response) {
                var data = response.data;
                if (data.length > 0) {
                    $scope.clientSelection.availableClients = data;
                }
            }, function(response) {
                $scope.errorText = "Mandanten konnten nicht geladen werden.";
            });
        };
        getClients();

        $scope.changeClient = function() {
            $scope.clientSelection.chosen = "";
        }

        $scope.setClient = function() {
            $scope.disableClientChange = true;
            $scope.error = null;
            $scope.errorText = null;
            TestComparisonService.getTestRuns($scope.clientSelection.chosen).then(function(testRuns) {
                $scope.testRuns = testRuns;
                $scope.baseRun = testRuns[0] ? testRuns[0] : null;
                $scope.compareRun = testRuns[1] ? testRuns[1] : null;
                $scope.isLoading = false;
                $scope.disableClientChange = false;
            }, handleError);
        };

        $scope.compareRuns = function() {
            $scope.isComparing = true;
            $scope.disableClientChange = true;
            TestComparisonService.getTestComparison(this.baseRun, this.compareRun, $scope.clientSelection.chosen).then(function(result) {
                $scope.positiveChangedTestResults = result.positiveChanged;
                $scope.negativeChangedTestResults = result.negativeChanged;
                $scope.isComparing = false;
                $scope.disableClientChange = false;
            }, handleError);
        };

        $scope.openTestResult = function(testResult) {
            $uibModal.open({
                templateUrl: 'testResultModal.html',
                controller: ['$scope', 'TestComparisonService', function($scope, TestComparisonService) {
                    $scope.isLoading = true;

                    $q.all([
                        TestComparisonService.getTestResultDetails(testResult.baseResultId, $scope.clientSelection.chosen),
                        TestComparisonService.getTestResultDetails(testResult.compareResultId, $scope.clientSelection.chosen),
                    ]).then(function(testResultArray) {
                        $scope.testResults = testResultArray;
                        $scope.isLoading = false;
                    }, function(error) {
                        handleError(error);
                        $scope.$dismiss();
                    });
                }]
            }).result.catch(function() {});
        };

        function handleError(error) {
            console.log(error);
            $scope.error = error;
        }
    }
]);
