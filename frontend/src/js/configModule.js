/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var configManagement = angular.module('eva.configManagement', [
  'pascalprecht.translate',
  'smart-table',
  'ui.bootstrap'
]);

configManagement.config(['$translateProvider', function($translateProvider) {
  // I18N setup
  $translateProvider.translations('en', {

  });

  $translateProvider.translations('de', {

  });
}]);
