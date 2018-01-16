/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('eva.variableStore').controller('VariableStoreCtrl', ['$scope', '$location', '$translate', '$uibModal', '$window', 'VariableStoreService', 'ConfigService',
  function($scope, $location, $translate, $uibModal, $window, VariableStoreService, ConfigService) {
    $scope.variables = [];
    $scope.error = null;

    // initialize copy to clipboard functionality
    new Clipboard('.btn');

    // Scope Functions
    $scope.loadVariables = function(forceReload) {
      $scope.isLoading = true;
      VariableStoreService.getVariables(forceReload).then(function(variables) {
        $scope.variables = variables;
        $scope.isLoading = false;
      }, handleError);
    }
    $scope.loadVariables();


    $scope.openDeleteModal = function(variableName) {
      $uibModal.open({
        templateUrl: 'deleteModal.html',
        scope: $scope,
        controller: ['$scope', function($scope) {
          $scope.isDeleting = false;
          $scope.variableToDelete = variableName;

          $scope.deleteVariable = function() {
            $scope.isDeleting = true;
            var promise;
            promise = VariableStoreService.deleteVariable(variableName).catch(handleError);
            promise.catch(handleError).finally(function() {
              $scope.isDeleting = false;
              $scope.$dismiss();
            });
          };
        }]
      }).result.catch(function() {});
    };

    // watch for loading
    $scope.$watch('isLoading', function() {
        if($scope.isLoading == true) {
          blur = document.getElementsByClassName("blur_hide");
          blur.className = "ng-show";
          // hide display
        } else {
          blur = document.getElementById("blur_hide");
          blur.style.opacity = 0;
          blur.style.visibility = "hidden";
        }
    });

    $scope.openEditModal = function(editVariable, variable) {
      $uibModal.open({
        templateUrl: 'editModal.html',
        scope: $scope,
        controller: ['$scope', function($scope) {
          $scope.isSaving = false;
          $scope.editVariable = editVariable;
          if($scope.editVariable) {
            $scope.variable = JSON.parse(JSON.stringify(variable));
          } else {
            $scope.variable = {};
          }

          $scope.deleteError = function() {
            $scope.errorText = undefined;
          }

          $scope.saveVariable = function() {
            var error = false;
            $scope.errorText = undefined;
            $scope.isSaving = true;
            if(!$scope.variable.abbreviation || $scope.variable.abbreviation.length < 1) {
              $scope.variable.abbreviation = null;
            }
            if(!$scope.variable.tooltip || $scope.variable.tooltip.length < 1) {
              $scope.variable.tooltip = null;
            }
            var regex = /([A-Za-z0-9äöüß][A-Za-z0-9äöüß_\s]*?[A-Za-z0-9äöüß])/g;
            if(!$scope.variable.name || !$scope.variable.name.length > 0 || !$scope.variable.value || !$scope.variable.value.length > 0) {
              $scope.errorText = "NECESSARY_FIELDS";
              error = true;
            } else if (!regex.test($scope.variable.name)) {
              $scope.errorText = "INVALID_VARIABLE_NAME_FORMAT";
              error = true;
            }

            if(!error) {
              var promise;
              promise = VariableStoreService.saveVariable($scope.variable, $scope.editVariable).catch(handleError);
              promise.catch(handleError).finally(function() {
                $scope.isSaving = false;
                $scope.loadVariables(true);
                $scope.$dismiss();
              });
            } else {
              $scope.isSaving = false;
            }
          };
        }]
      }).result.catch(function() {});
    };

    function handleError(error) {
      console.log(error);
      $scope.error = error;
    }
  }
]);
