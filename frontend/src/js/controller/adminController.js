/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main')
.controller('AdminCtrl', ['$scope', 'ConfigService',


    function($scope, ConfigService) {
      ConfigService.getConfig('general').then(function(result) {
        $scope.environment = result.environment;
      }).then(function(err) {
        $scope.errorText = err;
      });
    }

]);
