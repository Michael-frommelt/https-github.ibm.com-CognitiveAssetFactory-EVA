/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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
