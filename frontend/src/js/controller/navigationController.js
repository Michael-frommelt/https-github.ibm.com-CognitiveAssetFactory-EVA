/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main').controller('NavigationCtrl', ['$scope', '$location', '$rootScope', 'AuthenticationService',
  function($scope, $location, $rootScope, AuthenticationService) {
    $scope.location = $location.path();

    $rootScope.$on('$routeChangeSuccess', function() {
      $scope.location = $location.path();
    });

    var userData = AuthenticationService.getUserData();
    if (userData) $scope.loggedInUser = userData.name;
  }
]);
