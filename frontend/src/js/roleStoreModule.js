/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
angular.module('eva.roleStore', [
  'pascalprecht.translate',
  'smart-table',
  'ui.bootstrap',
]).config(['$translateProvider', function($translateProvider) {
  // I18N setup
  $translateProvider.translations('en', {
    'ROLESTORE': 'Role Store',
    'SEARCH': 'Search...',
    'ROLE_ID': 'Role ID',
    'ROLE_NAME': 'Role name',
    'PERMISSION': 'Permission',
    'PERMISSIONS': 'Permissions',
    'ROLE_NEW': 'New role',
    'LOADING': 'Loading...',
    'ROLE_SEARCH_NOT_FOUND': 'No roles found',
    'DELETE_ROLE_TITLE': 'Delete Role',
    'DELETE_ROLE_TEXT': 'Are you sure you want to delete the following role: ',
    'ROLE_WARNING_TEXT_1': 'There are still ',
    'ROLE_WARNING_TEXT_2': ' users, that have this role. Deleting it will remove it and its associated permissions from those users.',
    'CLEAN_UP_USERS': 'Remove invalid roles and permissions from users',
    'NO': 'No',
    'YES': 'Yes',
    'NEW_ROLE_TITLE': 'New role',
    'EDIT_ROLE_TITLE': 'Edit role',
    'CANCEL': 'Cancel',
    'SAVE': 'Save',
    'ALLOWS': 'Allows',
  });

  $translateProvider.translations('de', {
    'ROLESTORE': 'Rollenverwaltung',
    'SEARCH': 'Suchen...',
    'ROLE_ID': 'Rollen-ID',
    'ROLE_NAME': 'Rollenname',
    'PERMISSION': 'Berechtigung',
    'PERMISSIONS': 'Berechtigungen',
    'ROLE_NEW': 'Neue Rolle',
    'LOADING': 'Lade... Bitte warten',
    'ROLE_SEARCH_NOT_FOUND': 'Keine Rollen gefunden',
    'DELETE_ROLE_TITLE': 'Rolle löschen?',
    'DELETE_ROLE_TEXT': 'Sind Sie sicher, dass Sie die folgende Rolle löschen möchten: ',
    'ROLE_WARNING_TEXT_1': 'Es gibt noch ',
    'ROLE_WARNING_TEXT_2': ' Nutzer, die diese Rolle besitzen. Sie zu löschen wird die Rolle und alle dazugehörigen Berechtigungen für diese Nutzer entfernen.',
    'CLEAN_UP_USERS': 'Ungültige Rollen und Berechtigungen von Nutzern entfernen',
    'NO': 'Nein',
    'YES': 'Ja',
    'NEW_ROLE_TITLE': 'Neue Rolle',
    'EDIT_ROLE_TITLE': 'Rolle bearbeiten',
    'CANCEL': 'Abbrechen',
    'SAVE': 'Speichern',
    'ALLOWS': 'Erlaubt',
  });
}]);
