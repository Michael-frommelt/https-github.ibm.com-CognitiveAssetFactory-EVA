/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var userManagement = angular.module('eva.userManagement', [
  'pascalprecht.translate',
  'smart-table',
  'ui.bootstrap'
]);

userManagement.config(['$translateProvider', function($translateProvider) {
  // I18N setup
  $translateProvider.translations('en', {
    'USERSTORE': 'User Management',
    'SEARCH': 'Search...',
    'CHANGE': 'Change operations',
    'CHOOSE_CLIENTS': 'Choose clients',
    'USER_NEW': 'New User',
    'USER_NAME': 'Username',
    'PASSWORD': 'Password',
    'DEBUGMODE': 'Debugmode',
    'CLIENTS': 'Clients',
    'ROLE': 'Role',
    'PERMISSIONS': 'Permissions',
    'LOADING': 'Loading...',
    'NO': 'No',
    'YES': 'Yes',
    'CANCEL': 'Cancel',
    'SAVE': 'Save',
    'USER_SEARCH_NOT_FOUND': 'No registred users found...',
    'REQUIRED_INPUT': 'Required input',
    'REMOVE_ONLY': '(When removed: client can only be added again via the database)',
    'EDIT_USER_NAME': 'Edit privileges for',
    'EDIT_USER_PASSWORD': 'Edit password for',
    'DELETE_USER_TEXT': 'Do you really want to delete the following user:',
    'DELETE_USER_TITLE': 'Delete user',
    'NEW_USER_NAME': 'Create new user',
    'WRONG_PASSWORD': 'You entered a wrong password',
    'REGISTER_PROBLEM': 'There was a problem with the user registration.',
    'CLIENTS_ERROR': 'Clients could not be loaded.',
    'EDIT_PASSWORD': 'Change password',
    'EDIT_PRIVILEGES': 'Change privileges',
    'FORM_PLACEHOLDER_PW': 'Type your password...',
    'ENABLED': 'Enabled',
    'FORM_PLACEHOLDER_PW2': 'Repeat your password...',
    'MISSING_FIELD': 'Please fill in all mandatory fields',
    'REGISTER': 'Register',
    'USER_EXIST': 'The username already exists'
  });


  $translateProvider.translations('de', {
    'USERSTORE': 'Benutzerverwaltung',
    'SEARCH': 'Suchen...',
    'CHANGE': 'Operationen zur Benutzerverwaltung',
    'CHOOSE_CLIENTS': 'Clients auswählen',
    'USER_NEW': 'Neuer Nutzer',
    'USER_NAME': 'Benutzername',
    'PASSWORD': 'Passwort',
    'DEBUGMODE': 'Debugmodus',
    'CLIENTS': 'Mandanten',
    'ROLE': 'Rolle',
    'PERMISSIONS': 'Berechtigungen',
    'LOADING': 'Lade... Bitte warten.',
    'NO': 'Nein',
    'YES': 'Ja',
    'CANCEL': 'Abbrechen',
    'SAVE': 'Speichern',
    'USER_SEARCH_NOT_FOUND': 'Keine registrierten Benutzer gefunden...',
    'REQUIRED_INPUT': 'Verpflichtende Eingabe',
    'REMOVE_ONLY': '(Bei Entfernen: erneutes Hinzufügen nur über die Datenbank möglich)',
    'EDIT_USER_NAME': 'Berechtigungen ändern für',
    'EDIT_USER_PASSWORD': 'Passwort ändern für',
    'DELETE_USER_TEXT': 'Möchten Sie den folgenden Nutzer wiklich löschen:',
    'DELETE_USER_TITLE': 'Nutzer löschen',
    'NEW_USER_NAME': 'Neuen Nutzer erstellen',
    'WRONG_PASSWORD': 'Sie haben ein falsches Password eingegeben',
    'REGISTER_PROBLEM': 'Es gab ein Problem mit der Registrierung des Users.',
    'CLIENTS_ERROR': 'Mandanten konnten nicht geladen werden.',
    'EDIT_PASSWORD': 'Passwort ändern',
    'EDIT_PRIVILEGES': 'Berechtigungen ändern',
    'ENABLED': 'Aktiviert',
    'FORM_PLACEHOLDER_PW': 'Bitte Passwort eingeben...',
    'FORM_PLACEHOLDER_PW2': 'Bitte Passwort wiederholen...',
    'MISSING_FIELD': 'Bitte füllen Sie alle verpflichtenden Felder aus',
    'REGISTER': 'Erstellen',
    'USER_EXIST': 'Der Nutzername ist bereits vergeben'
  });
}]);
