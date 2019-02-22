/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
angular.module('main')
// Login controller setup
.controller('LoginCtrl', ['$rootScope', '$scope', '$http', '$location', 'AuthenticationService',
  function($rootScope, $scope, $http, $location, AuthenticationService) {
    $scope.failed_login = "";
    $scope.clients = [];

    if($rootScope.timeout) {
      $scope.failed_login = "Timeout. Sie wurden automatisch ausgeloggt.";
    }

    $scope.login = function() {
      delete $rootScope.timeout;
      delete $scope.failed_login;

      if ($scope.username !== undefined || $scope.password !== undefined) {
        // request user login by sending username and password
        AuthenticationService.login($scope.username, $scope.password, $scope.client).then(function(username) {
          if($scope.client === "admin") {
            $location.path("/admin");
          } else {
            $location.path("/conversation/" + $scope.client);
          }
        }, function(error) {
          console.log(error);
          var data = error.data;
          if(data.code === "wrong_username_or_password") {
            $scope.$parent.failed_login = "Das Kennwort oder Benutzername ist leider falsch.";// + data.message;
          } else if (data.code == "client_not_allowed") {
            $scope.$parent.failed_login = "Sie haben keinen Zugriff auf den ausgewählten Mandanten.";
          } else {
            $scope.$parent.failed_login = "Unbekannter Fehler.";
          }
        });
      }
    };

    $scope.getClients = function() {
      $http({
        method: "POST",
        url: '/api/user/getClients/false/true'
      }).then(function(response) {
        var data = response.data;
        $scope.clients = data;
        if($scope.clients.length > 0) {
          $scope.client = $scope.clients[0].id;
        }
      }, function(error) {
        $scope.$parent.failed_login = "Mandanten konnten nicht geladen werden.";
      });
    };

    $scope.getClients();

  }
]);
