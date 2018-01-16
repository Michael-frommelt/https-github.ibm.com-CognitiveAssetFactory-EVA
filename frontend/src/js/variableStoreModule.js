/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var variableStore = angular.module('eva.variableStore', [
  'pascalprecht.translate',
  'smart-table',
  'ui.bootstrap'
]);

variableStore.config(['$translateProvider', function($translateProvider) {
  // I18N setup
  $translateProvider.translations('en', {
    'VARIABLESTORE': 'Variable Store',
    'SEARCH': 'Search...',
    'VARIABLE_BINDING_TITLE': 'Bind your variable',
    'VARIABLE_ID': 'Variable name',
    'ABBREVIATION_EXISTS': 'Abbreviation exists',
    'TOOLTIP_EXISTS': 'Tooltip exists',
    'VARIABLE_CONTENT': 'Variable value',
    'VARIABLE_NEW': 'New Variable',
    'LOADING': 'Loading...',
    'VARIABLE_SEARCH_NOT_FOUND': 'No Variable found...',
    'DELETE_VARIABLE_TITLE': 'Delete Variable?',
    'DELETE_VARIABLE_TEXT': 'Are you sure you want to delete the following variable: ',
    'NO': 'No',
    'YES': 'Yes',
    'EDIT_VARIABLE_TITLE': 'Edit Variable...',
    'NEW_VARIABLE_TITLE': 'New Variable...',
    'VARIABLE_ABBREVIATION': 'Abbreviation',
    'VARIABLE_TOOLTIP': 'Tooltip',
    'CANCEL': 'Cancel',
    'SAVE': 'Save',
    'REQUIRED_INPUT': 'Required input'
  });

  $translateProvider.translations('de', {
    'VARIABLESTORE': 'Variablenverwaltung',
    'SEARCH': 'Suchen...',
    'VARIABLE_BINDING_TITLE': 'Variable einbinden',
    'VARIABLE_ID': 'Variablenname',
    'ABBREVIATION_EXISTS': 'Abkürzung vorhanden?',
    'TOOLTIP_EXISTS': 'Tooltip vorhanden?',
    'VARIABLE_CONTENT': 'Variablenwert',
    'VARIABLE_NEW': 'Neue Variable',
    'LOADING': 'Lade... Bitte warten.',
    'VARIABLE_SEARCH_NOT_FOUND': 'Keine Variable gefunden...',
    'DELETE_VARIABLE_TITLE': 'Variable löschen?',
    'DELETE_VARIABLE_TEXT': 'Sind Sie sich sicher, dass Sie die folgende Variable löschen möchten: ',
    'NO': 'Nein',
    'YES': 'Ja',
    'EDIT_VARIABLE_TITLE': 'Variable bearbeiten...',
    'NEW_VARIABLE_TITLE': 'Neue Variable...',
    'VARIABLE_ABBREVIATION': 'Abkürzung',
    'VARIABLE_TOOLTIP': 'Tooltip',
    'CANCEL': 'Abbrechen',
    'SAVE': 'Speichern',
    'REQUIRED_INPUT': 'Verpflichtende Eingabe'
  });
}]);
