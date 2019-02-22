/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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
