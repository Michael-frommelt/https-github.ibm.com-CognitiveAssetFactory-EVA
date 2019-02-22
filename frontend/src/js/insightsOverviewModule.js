/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var insightsOverview = angular.module('eva.insightsOverview', [
  'pascalprecht.translate',
  'smart-table',
  'ui.bootstrap'
]);

insightsOverview.config(['$translateProvider', function($translateProvider) {
  // I18N setup
  $translateProvider.translations('en', {
    'MATRIX_CONFIG': 'Matrix Configuration',
    'TEST_DATE': 'Choose test time',
    'NEW_SETTINGS': 'Confirm new settings',
    'MATRIX': 'Confusion Matrix',
    'LOADING': 'Loading...',
    'ACTUAL_INTENT': 'Actual Intent',
    'PREDICTED_INTENT': 'Predicted Intent'
  });

  $translateProvider.translations('de', {
    'MATRIX_CONFIG': 'Matrix Konfiguration',
    'TEST_DATE': 'Testzeit auswählen',
    'NEW_SETTINGS': 'Einstellungen übernehmen',
    'MATRIX': 'Konfusionsmatrix',
    'LOADING': 'Laden...',
    'ACTUAL_INTENT': 'Tatsächlicher Intent',
    'PREDICTED_INTENT': 'Vorhergesagter Intent'
    });
}]);
