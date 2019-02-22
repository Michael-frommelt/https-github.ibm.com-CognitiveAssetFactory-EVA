/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

angular.module('main', [
  'angular.chips',
  'ngRoute',
  'pascalprecht.translate',
  'ui.bootstrap',
  'chart.js',
  'angularCSS',
  'ngSanitize',
  'permission',
  'permission.ng',
  'eva.answerStore',
  'eva.insightsOverview',
  'eva.kfoldOverview',
  'eva.testing',
  'eva.variableStore',
  'eva.roleStore',
  'eva.userManagement',
  'eva.configManagement',
  'eva.statistics',
  'eva.conversationFeedback',
])

.filter('trusted', ['$sce', function ($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}])

.filter('unsafe', ['$sce', function ($sce) {
    return function(html) {
        return $sce.trustAsHtml(html);
    };
}])

.service('authInterceptor', ['$q', '$location', '$rootScope', '$window', function($q, $location, $rootScope, $window) {
    var service = this;

    service.responseError = function(response) {
        if (response.status == 401){
            $window.sessionStorage.removeItem('user');
            $rootScope.timeout = true;
            $location.path("/login");
        }
        return $q.reject(response);
    };
}])

// module configuration
.config(['$routeProvider', '$locationProvider', '$translateProvider', '$windowProvider', '$httpProvider', 'PERMISSION_DESCRIPTIONS',
  function($routeProvider, $locationProvider, $translateProvider, $windowProvider, $httpProvider, PERMISSION_DESCRIPTIONS) {

    $httpProvider.interceptors.push('authInterceptor');

    // routing and loading of views
    var viewsFolder = 'views/';
    var adminFolder = 'views/admin/';
    var html = '.html';
    $routeProvider.
    when('/admin', {
      templateUrl: adminFolder + 'index' + html,
      controller: 'AdminCtrl',
      data: { permissions: {
        only: 'isAdmin',
      }},
      css: ['css/general0.css', 'css/admin/style.css']
    }).
    when('/admin/report', {
      templateUrl: adminFolder + 'reporting' + html,
      controller: 'ReportingCtrl',
      data: { permissions: {
        only: 'viewReport',
      }},
      css: ['css/general0.css', 'css/admin/style.css', 'css/admin/reporting.css']
    }).
    when('/admin/statistics', {
      templateUrl: adminFolder + 'statistics' + html,
      controller: 'StatisticsCtrl',
      data: { permissions: {
        only: 'viewReport',
      }},
      css: ['css/general0.css', 'css/admin/style.css', 'css/admin/statistics.css']
    }).
    when('/admin/conversationFeedback', {
      templateUrl: adminFolder + 'conversationFeedback' + html,
      controller: 'ConversationFeedbackCtrl',
      data: { permissions: {
        only: 'viewReport',
      }},
      css: ['css/general0.css', 'css/admin/style.css', 'css/admin/conversationFeedback.css']
    }).
    when('/admin/insights', {
      templateUrl: adminFolder + 'insights' + html,
      controller: 'InsightsCtrl',
      data: { permissions: {
        only: 'editTesting',
      }},
      css: ['css/general0.css', 'css/admin/style.css', 'css/admin/insights.css']
    }).
    when('/admin/kfold', {
      templateUrl: adminFolder + 'kfold' + html,
      controller: 'KFoldCtrl',
      data: { permissions: {
        only: 'editTesting',
      }},
      css: ['css/general0.css', 'css/admin/style.css', 'css/admin/insights.css']
    }).
    when('/admin/testing', {
      templateUrl: adminFolder + 'testing' + html,
      controller: 'TestingCtrl',
      data: { permissions: {
        only: 'editTesting',
      }},
      css: ['css/general0.css', 'css/admin/style.css', 'css/admin/insights.css', 'css/admin/testing.css']
    }).
    when('/admin/test-comparison', {
      templateUrl: adminFolder + 'testComparison' + html,
      controller: 'TestComparisonCtrl',
      data: { permissions: {
        only: 'editTesting',
      }},
      css: ['css/general0.css', 'css/admin/style.css', 'css/admin/testing.css']
    }).
   when('/admin/config', {
     templateUrl: adminFolder + 'config' + html,
     controller: 'configCtrl',
     data: { permissions: {
      only: 'editConfiguration',
    }},
     css: ['css/general0.css', 'css/admin/style.css', 'css/admin/config.css']
   }).
    when('/admin/training', {
      templateUrl: adminFolder + 'training' + html,
      controller: 'TrainingCtrl',
      data: { permissions: {
        only: 'viewReport',
      }},
      css: ['css/general0.css', 'css/admin/style.css']
    }).
    when('/admin/roles', {
      templateUrl: adminFolder + 'roleStore' + html,
      controller: 'RoleStoreCtrl',
      data: { permissions: {
        only: 'editRoles',
      }},
      css: ['css/admin/style.css', 'css/admin/roleStore.css']
    }).
    when('/admin/user', {
      templateUrl: adminFolder + 'user' + html,
      controller: 'UserCtrl',
      data: { permissions: {
        only: ['isAdmin', 'editUsers'],
      }},
      css: ['css/general0.css', 'css/admin/style.css', 'css/admin/userManagement.css']
    }).
    when('/admin/answerStore', {
      templateUrl: adminFolder + 'answerStore' + html,
      controller: 'AnswerStoreCtrl',
      data: { permissions: {
        only: 'editAnswers',
      }},
      css: ['css/admin/style.css', 'css/admin/answerStore.css']
    }).
    when('/admin/variableStore', {
      templateUrl: adminFolder + 'variableStore' + html,
      controller: 'VariableStoreCtrl',
      data: { permissions: {
        only: 'editVariables',
      }},
      css: ['css/general0.css', 'css/admin/style.css', 'css/admin/variableStore.css']
    }).
    when('/admin/answerStore/:answerSetId/:answerId/:answerOptionIndex?', {
      templateUrl: adminFolder + 'answerStoreDetail' + html,
      controller: 'AnswerStoreDetailCtrl',
      data: { permissions: {
        only: 'editAnswers',
      }},
      css: ['css/admin/style.css', 'css/admin/answerStore.css']
    }).
    when('/admin/settings', {
      templateUrl: adminFolder + 'settings' + html,
      controller: 'SettingsCtrl',
      data: { permissions: {
        only: 'editSettings',
      }},
      css: ['css/general0.css', 'css/admin/style.css', 'css/admin/settings.css']
    }).
    when('/conversation/:clientId', {
      templateUrl: function(params){ return viewsFolder + params.clientId + '/conversation' + html; },
      css: [function($routeParams){ return 'css/' + $routeParams.clientId + '/style.css'; }, 'css/general0.css'],
      controller: 'ConversationCtrl',
      data: { permissions: {
        only: 'isAuthenticated',
      }},
    }).
    when('/login', {
      templateUrl: viewsFolder + 'login' + html,
      controller: 'LoginCtrl',
      css: 'css/login.css'
    }).
    when('/logout', {
      templateUrl: viewsFolder + 'logout' + html,
      controller: 'LogoutCtrl',
      css: 'css/login.css'
    }).
    when('/noAdmin', {
      templateUrl: adminFolder + 'noAdmin' + html,
      data: { permissions: {
        only: 'isAuthenticated',
      }},
      css: 'css/login.css'
    }).
    when('/chooseClient', {
      templateUrl: viewsFolder + 'chooseClient' + html,
      controller: 'SwitchClientsCtrl',
      data: { permissions: {
        only: 'isAuthenticated',
        redirectTo: '/login',
      }},
      css: 'css/login.css'
    }).
    otherwise({
      redirectTo: '/chooseClient'
    });

    // i18n handling
    $translateProvider.translations('en', {
      'META_TITLE': 'EVA - IBM Watson',
      'GENERAL_CANCEL': 'Cancel',
      'GENERAL_UPLOAD': 'Upload',
      'NAV_HOME': 'Home',
      'NAV_REPORT': 'Reporting',
      'NAV_RESET': 'Reset',
      'NAV_TRAINING': 'Training',
      'NAV_STATISTICS': 'Statistics',
      'NAV_LOGOUT': 'Logout',
      'NAV_LOGIN': 'Login',
      'NAV_USER': 'User Management',
      'NAV_INSIGHTS': 'Confusion Matrix',
      'NAV_KFOLD': 'K-fold Cross Validation',
      'NAV_TESTING': 'Testing',
      'NAV_CONFIG': 'Configuration',
      'NAV_ANSWERSTORE': 'Answer Store',
      'NAV_ROLESTORE': 'User roles',
      'NAV_VARIABLESTORE': 'Variable Store',
      'NAV_SETTINGS': 'Settings',
      'NAV_SIGNEDINAS': 'Signed in as',
      'NAV_CONVERSATIONFEEDBACK': 'Conversation Feedback',
      'NAV_TEST_COMPARISON': 'Test Comparison',
      'NAV_TEST': 'Dialog Test',
      'DIALOG_CHOOSE': 'Choose a dialog',
      'DIALOG_UPLOAD': 'Upload a new dialog',
      'DIALOG_WELCOME': 'Have a conversation',
      'DIALOG_RESPONSE_PLACEHOLDER': 'Type a message',
      'DIALOG_SEND': 'Send',
      'DIALOG_SENDCOMMENT': 'Send Comment',
      'DIALOG_USEFUL': 'Useful',
      'DIALOG_NOTUSEFUL': 'Not Useful',
      'DIALOG_COMMENT': 'Comment',
      'DIALOG_PLACEHOLDER_NAME': 'Dialog Name...',
      'FORM_REGISTER_USER': 'Register User',
      'FORM_CREATE_USER': 'Create User',
      'FORM_PLACEHOLDER_USER': 'Type your username...',
      'FORM_PLACEHOLDER_PW': 'Type your password...',

      // Configuration strings
      'CONFIGURATION': 'Configuration',
      'RELOAD_CLIENTS': 'Reload clients',
      'SAVE_CONFIG': 'Save edited configuration',
      'LOADING': 'Loading...',
      'ARRAY': 'Array',
      'OBJECT': 'Object',
      'TOOLTIP_MOVE_CONFIGPROPERTY_UP': 'Move element up',
      'TOOLTIP_MOVE_CONFIGPROPERTY_DOWN': 'Move element down',
      'TOOLTIP_DELETE_CONFIGPROPERTY': 'Delete element',
      'ADD': 'Add',
      'ADD_PROPERTY': 'Add property',
      'ADD_PROPERTY_TEXT': 'Please enter the name of the new property:',
      'ADD_PROPERTY_STRING': 'Add string',
      'ADD_PROPERTY_NUMBER': 'Add number',
      'ADD_PROPERTY_BOOLEAN': 'Add boolean',
      'ADD_PROPERTY_OBJECT': 'Add object',
      'ADD_PROPERTY_ARRAY': 'Add array',
      'DELETE_PROPERTY_TITLE': 'Delete property',
      'DELETE_PROPERTY_TEXT': 'Are you sure that you want to delete this property: ',
      'DELETE_PROPERTY_OBJECT_ADDITION': 'This will also delete all its members.',
      'ERROR_PROPERTY_NAME_UNIQUE': 'The property name must not exist already.',

      'SETTINGS': 'Settings',
      'ANSWER_STORE_SETTINGS': 'Answer Store settings',
      'ANSWER_PROPERTIES': 'Answer properties',
      'UPDATE_INTERVAL': 'Update interval',
      'SHOW_WYSIWYG_EDITOR': 'Show WYSIWYG editor',
      'ANSWER_TEXT_SIZE': 'Recommended size for answer texts',
      'MULTIPLE_CHOICE_DISTANCE_MEASURE': 'Multiple choice distance measure',
      'FILE_SIZE_LIMIT': 'Size limit for file imports',
      'CHARACTERS': 'characters',
      'KILOBYTES': 'KB',
      'DELETE_ANSWER_PROPERTY': 'Delete answer property',
      'DELETE_ANSWER_PROPERTY_TEXT': 'Are you sure that you want to delete this answer property?',
      'YES': 'Yes',
      'NO': 'No',
      'SECONDS': 'sec',
      'NAME': 'Name',
      'NAME_USED_TEXT': 'This name is already in use.',
      'DISPLAY_NAME': 'Display name',
      'REQUIRED': 'Required property',
      'NOT_A_NUMBER_TEXT': 'This value must be a number.',
      'REQUIRED_TEXT': 'This field is required.',
      'BIGGER_THAN_MIN_TEXT': 'This value needs to be bigger than the "minimal value" field.',
      'TYPE': 'Type',
      'TYPE_NUMBER': 'Number',
      'TYPE_MULTIPLE_CHOICE': 'Multiple choice',
      'MIN_VALUE': 'Minimal value',
      'MAX_VALUE': 'Maximal value',
      'CHOICES': 'Choices',

      // Answer version strings
      'ANSWER_ID': 'Answer ID',
      'ANSWER_VERSION_DELETE_EXPIRATION': 'Expiration time for versions of deleted answers',
      'ANSWER_VERSION_LIMIT': 'Maximum of versions per answer',
      'DAYS': 'days',
      'DELETED_ANSWERS': 'Deleted answers',
      'NO_DELETED_ANSWERS': 'No deleted answers',
      'RECOVER_ANSWER':'Recover answer',

      // Sync strings
      'SYNC': 'Synchronization of data sources',
      'BTN_ANSWERID_SYNC': 'Sync answer IDs',
      'BTN_VARIABLE_SYNC': 'Sync variables',
      'ANSWERID_SYNC': 'Difference between Answer IDs stored in Conversation and the Answer Store',
      'VARIABLES_SYNC': 'Difference between variables stored in the Variable Store and used in answer texts',
      'ANSWERIDS_ONLY_WCS': 'Answer IDs only present in Conversation',
      'VARIABLES_ONLY_VARIABLESTORE': 'Variables only present in the Variable Store',
      'ANSWERIDS_ONLY_ANSWERSTORE': 'Answer IDs only present in the Answer Store',
      'VARIABLES_ONLY_ANSWERSTORE': 'Variables only present in the Answer Store',

      // Feedback export strings
      'CANCEL_GENERATION': 'Cancel generation',
      'DOWNLOAD_EXPORT': 'Download export',
      'EXPORTING': 'Exporting',
      'EXPORT_ALL': 'Export all',
      'EXPORT_STATUS': 'Export status:',
      'EXPORT_WITH_FILTER': 'Export with active filter',
      'FINISHED': 'Finished',
      'GENERATE_EXPORT': 'Generate export',
    });

    $translateProvider.translations('de', {
      'META_TITLE': 'EVA - IBM Watson',
      'GENERAL_CANCEL': 'Abbrechen',
      'GENERAL_UPLOAD': 'Hochladen',
      'NAV_HOME': 'Chat',
      'NAV_REPORT': 'Bericht',
      'NAV_RESET': 'Neu laden',
      'NAV_TRAINING': 'Training',
      'NAV_CONFIG': 'Konfiguration',
      'NAV_STATISTICS': 'Statistik',
      'NAV_LOGOUT': 'Abmelden',
      'NAV_LOGIN': 'Einloggen',
      'NAV_USER': 'Benutzerverwaltung',
      'NAV_INSIGHTS': 'Konfusionsmatrix',
      'NAV_KFOLD': 'K-fold Cross Validation',
      'NAV_TESTING': 'Testing',
      'NAV_ANSWERSTORE': 'Antwortenverwaltung',
      'NAV_ROLESTORE': 'Nutzerrollen',
      'NAV_VARIABLESTORE': 'Variablenverwaltung',
      'NAV_SETTINGS': 'Einstellungen',
      'NAV_SIGNEDINAS': 'Angemeldet als',
      'NAV_CONVERSATIONFEEDBACK': 'Konversationsfeedback',
      'NAV_TEST_COMPARISON': 'Testvergleich',
      'NAV_TEST': 'Dialog-Test',
      'DIALOG_CHOOSE': 'Dialog wählen',
      'DIALOG_UPLOAD': 'Neuen Dialog hochladen',
      'DIALOG_WELCOME': '',
      'DIALOG_RESPONSE_PLACEHOLDER': 'Schreiben Sie eine Nachricht',
      'DIALOG_SEND': 'Senden',
      'DIALOG_SENDCOMMENT': 'Kommentar senden',
      'DIALOG_USEFUL': 'Nützlich',
      'DIALOG_NOTUSEFUL': 'Nicht nützlich',
      'DIALOG_COMMENT': 'Kommentar',
      'DIALOG_PLACEHOLDER_NAME': 'Name des Dialogs...',
      'FORM_REGISTER_USER': 'Nutzer registrieren',
      'FORM_CREATE_USER': 'Nutzer anlegen',
      'FORM_PLACEHOLDER_USER': 'Nutzernamen eingeben...',
      'FORM_PLACEHOLDER_PW': 'Passwort eingeben...',

      // Configuration strings
      'CONFIGURATION': 'Konfiguration',
      'RELOAD_CLIENTS': 'Clients neu laden',
      'SAVE_CONFIG': 'Bearbeitete Konfiguration speichern',
      'LOADING': 'Lade...',
      'ARRAY': 'Array',
      'OBJECT': 'Objekt',
      'TOOLTIP_MOVE_CONFIGPROPERTY_UP': 'Element nach oben verschieben',
      'TOOLTIP_MOVE_CONFIGPROPERTY_DOWN': 'Element nach unten verschieben',
      'TOOLTIP_DELETE_CONFIGPROPERTY': 'Element löschen',
      'ADD': 'Hinzufügen',
      'ADD_PROPERTY': 'Eigenschaft hinzufügen',
      'ADD_PROPERTY_TEXT': 'Bitte geben Sie den Namen der neuen Eigenschaft ein:',
      'ADD_PROPERTY_STRING': 'Zeichenkette hinzufügen',
      'ADD_PROPERTY_NUMBER': 'Zahl hinzufügen',
      'ADD_PROPERTY_BOOLEAN': 'Wahrheitswert hinzufügen',
      'ADD_PROPERTY_OBJECT': 'Objekt hinzufügen',
      'ADD_PROPERTY_ARRAY': 'Array hinzufügen',
      'DELETE_PROPERTY_TITLE': 'Eigenschaft löschen',
      'DELETE_PROPERTY_TEXT': 'Sind Sie sicher, dass Sie die folgende Eigenschaft löschen möchten: ',
      'DELETE_PROPERTY_OBJECT_ADDITION': 'Dies wird auch alle untergeordneten Eigenschaften entfernen.',
      'ERROR_PROPERTY_NAME_UNIQUE': 'Der Eigenschaftsname darf nicht bereits existieren.',

      'SETTINGS': 'Einstellungen',
      'ANSWER_STORE_SETTINGS': 'Einstellungen für die Antwortverwaltung',
      'UPDATE_INTERVAL': 'Aktualisierungsintervall',
      'SHOW_WYSIWYG_EDITOR': 'WYSIWYG-Editor anzeigen',
      'ANSWER_TEXT_SIZE': 'Empfohlene Größe für Antworttexte',
      'MULTIPLE_CHOICE_DISTANCE_MEASURE': 'Multiple Choice Distanzmaß',
      'FILE_SIZE_LIMIT': 'Größenlimit für Dateiimporte',
      'CHARACTERS': 'Zeichen',
      'KILOBYTES': 'KB',
      'ANSWER_PROPERTIES': 'Antworteigenschaften',
      'DELETE_ANSWER_PROPERTY': 'Antworteigenschaft löschen',
      'DELETE_ANSWER_PROPERTY_TEXT': 'Sind Sie sicher, dass Sie diese Antworteigenschaft löschen wollen?',
      'YES': 'Ja',
      'NO': 'Nein',
      'SECONDS': 'sek',
      'NAME': 'Name',
      'NAME_USED_TEXT': 'Dieser Name wird bereits benutzt.',
      'DISPLAY_NAME': 'Anzeigename',
      'REQUIRED': 'Pflichteigenschaft',
      'NOT_A_NUMBER_TEXT': 'Dieser Wert muss eine Zahl sein.',
      'REQUIRED_TEXT': 'Dies ist ein Pflichtfeld.',
      'BIGGER_THAN_MIN_TEXT': 'Dieser Wert muss größer als der Minimalwert sein.',
      'TYPE': 'Typ',
      'TYPE_NUMBER': 'Zahl',
      'TYPE_MULTIPLE_CHOICE': 'Multiple choice',
      'MIN_VALUE': 'Minimalwert',
      'MAX_VALUE': 'Maximalwert',
      'CHOICES': 'Auswahlmöglichkeiten',

      // Answer version strings
      'ANSWER_ID': 'Antwort ID',
      'ANSWER_VERSION_DELETE_EXPIRATION': 'Ablaufzeit für Versionen von gelöschten Antworten',
      'ANSWER_VERSION_LIMIT': 'Maximale Versionszahl für Antworten',
      'DAYS': 'Tage',
      'DELETED_ANSWERS': 'Gelöschte Antworten',
      'NO_DELETED_ANSWERS': 'Keine gelöschten Antworten',
      'RECOVER_ANSWER':'Antwort wiederherstellen',

      // Sync strings
      'SYNC': 'Synchronisation der Datenquellen',
      'BTN_ANSWERID_SYNC': 'Antwort IDs synchronisieren',
      'BTN_VARIABLE_SYNC': 'Variablen synchronisieren',
      'ANSWERID_SYNC': 'Unterschiede zwischen Antwort IDs in Conversation und in der Antwortverwaltung',
      'VARIABLES_SYNC': 'Unterschiede zwischen Variablen in der Variablenverwaltung und in Antworttexten',
      'ANSWERIDS_ONLY_WCS': 'Antwort IDs, die nur in Conversation vorhanden sind',
      'VARIABLES_ONLY_VARIABLESTORE': 'Variablen, die nur in der Variablenverwaltung vorhanden sind',
      'ANSWERIDS_ONLY_ANSWERSTORE': 'Antwort IDs, die nur in der Antwortverwaltung vorhanden sind',
      'VARIABLES_ONLY_ANSWERSTORE': 'Variablen, die nur in der Antwortverwaltung vorhanden sind',

      // Feedback export strings
      'CANCEL_GENERATION': 'Erstellung abbrechen',
      'DOWNLOAD_EXPORT': 'Export herunterladen',
      'EXPORTING': 'Exportiert',
      'EXPORT_ALL': 'Exportiere alle',
      'EXPORT_STATUS': 'Export Status:',
      'EXPORT_WITH_FILTER': 'Exportiere mit aktivem Filter',
      'FINISHED': 'Beendet',
      'GENERATE_EXPORT': 'Export generieren',
    });

    // Setup i18n descriptions for permissions from the permissions.js backend file
    var translationObject = {};
    var permission;
    for (permission in PERMISSION_DESCRIPTIONS.english) {
      translationObject['PERMISSION_TEXT_' + permission] = PERMISSION_DESCRIPTIONS.english[permission];
    }
    $translateProvider.translations('en', translationObject);
    translationObject = {};
    for (permission in PERMISSION_DESCRIPTIONS.german) {
      translationObject['PERMISSION_TEXT_' + permission] = PERMISSION_DESCRIPTIONS.german[permission];
    }
    $translateProvider.translations('de', translationObject);

    $translateProvider.useSanitizeValueStrategy('escape');

    var $window = $windowProvider.$get();
    var lang = $window.navigator.language || $window.navigator.userLanguage;
    if (lang.indexOf('de') === 0) {
      $translateProvider.preferredLanguage('de');
    } else {
      $translateProvider.preferredLanguage('en');
    }
  }
])

.run(['$rootScope',
  function($rootScope) {

  }
]);
