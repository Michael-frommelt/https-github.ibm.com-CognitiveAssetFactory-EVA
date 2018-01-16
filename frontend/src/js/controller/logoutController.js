/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main').controller('LogoutCtrl', ['$rootScope', '$scope', '$http', 'AuthenticationService',
  function($rootScope, $scope, $http, AuthenticationService) {
    $scope.failed_logout = '';
    $scope.logout_in_progress = true;
    $scope.logout_done = false;

    var logout = function() {
      AuthenticationService.logout().then(function() {
        $scope.logout_in_progress = false;
        $scope.logout_done = true;
      }, function(error) {
        $scope.failed_logout = 'Logout fehlgeschlagen. Error: ' + JSON.stringify(error);
        $scope.logout_in_progress = false;
      });
    };

    logout();
  }
]);
