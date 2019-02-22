/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var kfoldOverview = angular.module('eva.kfoldOverview', [
  'pascalprecht.translate',
  'smart-table',
  'ui.bootstrap'
]);

kfoldOverview.config(['$translateProvider', function($translateProvider) {
  // I18N setup
  $translateProvider.translations('en', {
    'KFOLD_HEADER': 'K-fold Cross Validation',
    'RUN_TEST': 'Run test',
    'CONF': 'Confidence',
    'RATIO': 'Success Ratio',
    'NUMCASES': 'Total Test Cases',
    'AVERAGE': 'Average',
    'START_KFOLD_TEST': 'Do you want to run a test for k = ',
    'OVERALL': 'Overall Performance',
    'KFOLD_TESTCASES': 'Single test cases for k = ',
    'KFOLD_INTENT_MODAL': ' and intent '
  });

  $translateProvider.translations('de', {
    'KFOLD_HEADER': 'K-fold Cross Validation',
    'RUN_TEST': 'Test starten',
    'CONF': 'Confidence',
    'RATIO': 'Erfolgsquote',
    'NUMCASES': 'Anzahl Testfälle',
    'AVERAGE': 'Durchschnitt',
    'START_KFOLD_TEST': 'Möchten Sie einen Test starten für k = ',
    'OVERALL': 'Gesamtperformance',
    'KFOLD_TESTCASES': 'Einzelne Testfälle für k = ',
    'KFOLD_INTENT_MODAL': ' und Intent '
  });
}]);
