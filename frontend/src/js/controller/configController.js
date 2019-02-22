/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
angular.module('eva.configManagement').controller('configCtrl', ['$scope', '$http', '$uibModal', 'ConfigService',
  function($scope, $http, $uibModal, ConfigService) {
    $scope.error = null;
    $scope.configObject = null;

    $scope.isNumber = angular.isNumber;
    $scope.isString = angular.isString;
    $scope.isArray = angular.isArray;
    $scope.isObject = angular.isObject;
    $scope.isBoolean = function(variable) {
      return typeof variable === 'boolean';
    };

    $scope.reloadClients = function() {
      $scope.isReloadingClients = true;
      ConfigService.reloadClients().catch(handleError).finally(function() {
        $scope.isReloadingClients = false;
      });
    };

    $scope.getGeneralConfig = function() {
      $scope.isLoadingConfig = true;
      ConfigService.getConfig('general').then(function(configObject) {
        delete configObject._id;
        $scope.configObject = configObject;
      }, handleError).finally(function() {
        $scope.isLoadingConfig = false;
      });
    };
    $scope.getGeneralConfig();

    $scope.saveGeneralConfig = function() {
      $scope.isSavingConfig = true;
    };

    $scope.openAddModal = function(parent, type) {
      $uibModal.open({
        templateUrl: 'addModal.html',
        controller: ['$scope', function($scope) {
          $scope.propertyNameValid = function() {
            for (var name in parent) {
              if (name === $scope.newName) return false;
            }
            return true;
          };

          $scope.addProperty = function() {
            var value = null;
            switch(type) {
            case 'number': value = 0; break;
            case 'boolean': value = false; break;
            case 'object': value = {}; break;
            case 'array': value = []; break;
            case 'string': default: value = '';
            }
            parent[$scope.newName] = value;
            $scope.$dismiss();
          };
        }]
      }).result.catch(function() {});
    };

    $scope.movePropertyUp = function(parent, propertyName) {
      if(angular.isArray(parent) && propertyName > 0 && propertyName < parent.length) {
        var temp = parent[propertyName-1];
        parent[propertyName-1] = parent[propertyName];
        parent[propertyName] = temp;
      }
    };

    $scope.movePropertyDown = function(parent, propertyName) {
      if(angular.isArray(parent) && propertyName >= 0 && propertyName < parent.length - 1) {
        var temp = parent[propertyName+1];
        parent[propertyName+1] = parent[propertyName];
        parent[propertyName] = temp;
      }
    };

    $scope.openDeleteModal = function(parent, propertyName, isObject) {
      $uibModal.open({
        templateUrl: 'deleteModal.html',
        controller: ['$scope', function($scope) {
          $scope.isObject = isObject;
          $scope.propertyName = propertyName;

          $scope.deleteProperty = function() {
            if (angular.isArray(parent)) {
              parent.splice(propertyName, 1);
            } else {
              delete parent[propertyName];
            }
            $scope.$dismiss();
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
