/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main')
// controller to switch clients
.controller('SwitchClientsCtrl', ['$scope', '$http', '$location', '$routeParams',
  function($scope, $http, $location, $routeParams) {
    $scope.availableClients = [];
    if($routeParams.clientId !== undefined) {
      $scope.clientId = $routeParams.clientId;
    } else {
      var res = $location.$$path.split("/");
      if(res[1] === "admin") {
        $scope.clientId = "admin";
      }
    }
    $scope.chosenClient = $scope.clientId;

    var getAvailableClientsForUser = function() {
      $http({
        method: "POST",
        url: '/api/user/getClientsForUser/true/true'
      }).then(function(response) {
        var data = response.data;
        if(data.length > 0) {
          $scope.availableClients = data;
        }
      }, function(error) {
        $scope.$parent.failed_login = "Mandanten konnten nicht geladen werden.";
      });
    };

    getAvailableClientsForUser();

    $scope.updateClient = function() {
      if($scope.chosenClient === "admin") {
        $location.path("/admin");
      } else {
        $location.path("/conversation/" + $scope.chosenClient);
      }
    };
  }
]);
