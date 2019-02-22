/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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
