/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

var testing = angular.module('eva.testing', [
    'pascalprecht.translate',
    'smart-table',
    'ui.bootstrap'
]);

userManagement.config(['$translateProvider', function($translateProvider) {
    // I18N setup
    $translateProvider.translations('en', {
        'CHOOSE_CLIENT': 'Choose Client',
        'CHOOSE_NEW_CLIENT': 'Choose different client',
        'SELECT_ALL': 'Select all',
        'LOADING': 'Loading...',
        'TEST_HIST': 'Testing History',
        'RUN': 'Test run',
        'INTENT_SEARCH_NOT_FOUND': 'No tests found...',
        'TABLE_OPTIONS': 'Table Options',
        'TEST_FILE': 'Test file',
        'CONF': ' Confidence *',
        'CONF_DESCRIPTION': '* Wrong classfied top intents will be count as 0.',
        'NUMID': ' Correct AnswerId',
        'NUMINT': ' Correct TopIntent',
        'NUMCASES': ' Number of test cases',
        'TESTING_CONFIG': 'Test Configuration',
        'INPUT': 'Please choose files for testing',
        'OPTION_SELECT': 'Please select property to be displayed by table',
        'RUN_TEST': 'Run test',
        'SELECTION_REQ': 'Select at least one file for testing.',
        'START_TEST': 'Do you want to start a test for the following files?',
        'EDIT_TESTCASE': 'Edit test case',
        'DELETE_TESTCASE': 'Delete test case',
        'UDPATE_TESTCASE': "Update!",
        'ADD_TESTCASE': 'Add test case',
        'CREATE_TESTCASE': 'Create!',
        'NO_TESTCASES_FOUND': 'No test cases found for selected client.',
        'NO_TESTRESULTS_CLIENT': 'No test results found for selected client.',
        'TEXT_DELETE_TESTCASE': 'Do you really want to delete the following test case?',
        'RESULT_TESTCASES': 'Test result for',
        'DELETE_TESTRUN': 'Delete test run',
        'TEXT_DELETE_TESTRUN': 'Do you really want to delete the following test run?',
        'TREND_OVERVIEW': 'Trend Overview',
        'NO_TREND_RESULTS': 'No trend overview available for selected client.',
        'SHOW_NUMBER_OF_TEST_CASES': 'number of test cases',

        // Test comparison
        'ACTUAL': 'Actual',
        'ANSWER_ID': 'Answer ID',
        'BASE_TEST_RUN': 'Test run 1',
        'CASE_ID': 'Test case ID',
        'COMPARE': 'Compare',
        'COMPARE_TEST_RUN': 'Test run 2',
        'DEBUG': 'Debug',
        'EXPECTED': 'Expected',
        'NEGATIVE_CHANGED_TEST_RESULTS': 'New failed tests in run 1',
        'NO_TEST_RESULTS': 'No test results in this section',
        'POSITIVE_CHANGED_TEST_RESULTS': 'New successful tests in run 1',
        'RESPONSE_TIME': 'Response time',
        'TEST_COMPARISON': 'Test comparison',
        'TEST_FILE_1': 'Test file',
        'TEST_INPUT': 'Test input',
        'TEST_STEP': 'Test step',
        'TEST_RESULT': 'Test result',
        'TOP_INTENT': 'Top Intent',
    });

    $translateProvider.translations('de', {
        'CHOOSE_CLIENT': 'Client auswählen',
        'CHOOSE_NEW_CLIENT': 'Client neu auswählen',
        'SELECT_ALL': 'Alle auswählen',
        'LOADING': 'Laden...',
        'ACTUAL_INTENT': 'Tatsächlicher Intent',
        'PREDICTED_INTENT': 'Vorhergesagter Intent',
        'TEST_HIST': 'Testhistorie',
        'RUN': 'Testlauf',
        'INTENT_SEARCH_NOT_FOUND': 'Keine Tests gefunden...',
        'TABLE_OPTIONS': 'Tabellenoptionen',
        'TEST_FILE': 'Testfall',
        'CONF': ' Konfidenz*',
        'CONF_DESCRIPTION': '* Falsch klassifizierte Top-Intents werden als 0 gewertet.',
        'NUMID': ' Korrekte AnswerId',
        'NUMINT': ' Korrekter TopIntent',
        'NUMCASES': ' Anzahl der Testcases',
        'TESTING_CONFIG': 'Test Konfiguration',
        'INPUT': 'Bitte wählen Sie zu testenden Dokumente',
        'OPTION_SELECT': 'Bitte wählen Sie die darzustellende Eigenschaft aus',
        'RUN_TEST': 'Test starten',
        'SELECTION_REQ': 'Bitte wählen Sie mindestens ein Dokument zum Testen aus.',
        'START_TEST': 'Möchten Sie einen Testlauf für die folgenden Dokumente starten?',
        'EDIT_TESTCASE': 'Testfall bearbeiten',
        'DELETE_TESTCASE': 'Testfall löschen',
        'UDPATE_TESTCASE': 'Aktualisieren!',
        'ADD_TESTCASE': 'Testfall hinzufügen',
        'CREATE_TESTCASE': 'Hinzufügen!',
        'NO_TESTCASES_FOUND': 'Es existieren keine Testfälle für den ausgewählten Client.',
        'NO_TESTRESULTS_CLIENT': 'Es existieren keine Testergebnisse für den ausgewählten Client.',
        'TEXT_DELETE_TESTCASE': 'Wollen Sie den folgenden Testfall wirklich löschen?',
        'RESULT_TESTCASES': 'Testergebnis für',
        'DELETE_TESTRUN': 'Testdurchlauf löschen',
        'TEXT_DELETE_TESTRUN': 'Wollen Sie den folgenden Testdurchlauf wirklich löschen?',
        'TREND_OVERVIEW': 'Trendübersicht',
        'NO_TREND_RESULTS': 'Es existiert keine Trendübersicht für den ausgewählten Client.',
        'SHOW_NUMBER_OF_TEST_CASES': 'Anzahl Testfälle',

        // Test comparison
        'ACTUAL': 'Erhalten',
        'ANSWER_ID': 'Antwort-ID',
        'BASE_TEST_RUN': 'Testlauf 1',
        'CASE_ID': 'Testfall-ID',
        'COMPARE_TEST_RUN': 'Testlauf 2',
        'COMPARE': 'Vergleichen',
        'DEBUG': 'Debug',
        'EXPECTED': 'Erwartet',
        'NEGATIVE_CHANGED_TEST_RESULTS': 'Neu fehlgeschlagene Tests in Lauf 1',
        'NO_TEST_RESULTS': 'Keine Testergebnisse in diesem Bereich',
        'POSITIVE_CHANGED_TEST_RESULTS': 'Neu erfolgreiche Tests in Lauf 1',
        'RESPONSE_TIME': 'Antwortzeit',
        'TEST_FILE_1': 'Testdatei',
        'TEST_COMPARISON': 'Testvergleich',
        'TEST_INPUT': 'Testeingabe',
        'TEST_STEP': 'Testschritt',
        'TEST_RESULT': 'Testergebnis',
        'TOP_INTENT': 'Top Intent',
    });
}]);
