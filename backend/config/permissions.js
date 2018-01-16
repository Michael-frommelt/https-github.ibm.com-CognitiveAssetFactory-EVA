/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
// Universal Module Definition pattern - https://github.com/umdjs/umd
// This is to enable the file to be loaded by the Node backend AND the Angular frontend
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory().permissions;
  } else if (typeof root.angular === 'object') {
    var data = factory();
    root.angular.module('main').constant('PERMISSIONS', data.permissions);
    root.angular.module('main').constant('PERMISSION_DESCRIPTIONS', data.descriptions);
  }
}(this, function() {
  // All permissions
  return {
    permissions: [
      // isAuthenticated: valid permission, that is tested via null checking the user object
      // isAdmin: valid permission, that is given if the user has the admin client
      'editAnswers',          // view answerStore page and access answerApi
      'editConfiguration',    // view config page and access configurationApi
      'editQuestions',        // view questionStore page and access questionApi
      'editRoles',            // view role management page and access permissionApi routes for roles
      'editSettings',         // view settings page and access answerApi routes for recovering answers and editing answer settings
      'editTesting',          // view confusionMatrix, k-foldCrossValidation and testing page and access all testing APIs
      'editUsers',            // view users page and access userApi
      'editVariables',        // view variableStore page and access variableApi
      'viewReport',           // view reporting and training page and access feedbackApi
    ],
    descriptions: {
      english: {
        editAnswers: 'View, create, edit and delete answers in the AnswerStore',
        editConfiguraton: 'View and edit the EVA configuration',
        editQuestions: 'View, create, edit and delete questions in the QuestionStore',
        editRoles: 'View, create, edit and delete roles in the role management',
        editSettings: 'View and edit the AnswerStore settings and recover deleted answers',
        editTesting: 'View the testing, confusion matrix and k-fold cross validation pages and start a test run',
        editUsers: 'View, create, edit and delete users and their permissions and reset passwords',
        editVariables: 'View, create, edit and delete variables in the VariableStore',
        viewReport: 'View the report and training pages', 
      },
      german: {
        editAnswers: 'Ansehen, Erstellen, Bearbeiten und Löschen von Antworten in der Antwortverwaltung',
        editConfiguration: 'Ansehen und Bearbeiten der EVA Konfiguration',
        editQuestions: 'Ansehen, Erstellen, Bearbeiten und Löschen von Fragen in der Fragenverwaltung',
        editRoles: 'Ansehen, Erstellen, Bearbeiten und Löschen von Nutzerrollen',
        editSettings: 'Ansehen und Bearbeiten der Einstellung der Antwortverwaltung sowie das Wiederherstellen gelöschter Antworten',
        editTesting: 'Ansehen der Testing-, Konfusionsmatrix- und K-Fold Cross Validation-Seiten und Starten eines Testlaufs',
        editUsers: 'Ansehen, Erstellen, Bearbeiten und Löschen von Nutzern und deren Berechtigungen sowie das Zurücksetzen von Passwörtern',
        editVariables: 'Ansehen, Erstellen, Bearbeiten und Löschen von Variablen in der Variablenverwaltung',
        viewReport: 'Ansehen Bericht- und Training-Seiten', 
      }
    }
  };
}));