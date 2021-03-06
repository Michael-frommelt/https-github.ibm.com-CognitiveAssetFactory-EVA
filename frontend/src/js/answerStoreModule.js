/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

 var answerStore = angular.module('eva.answerStore', [
  'angular.chips',
  'ngFileUpload',
  'summernote',
  'pascalprecht.translate',
  'smart-table',
  'ui.bootstrap'
]);

answerStore.config(['$translateProvider', function($translateProvider) {
  // I18N setup
  $translateProvider.translations('en', {
    // AnswerStore master view
    'ANSWERSTORE': 'AnswerStore',
    'ANSWER': 'Answer',
    'ANSWEROPTION': 'Answer option',
    'ANSWER_ID': 'Answer ID',
    'ANSWER_NEW': 'New Answer',
    'ANSWER_SET': 'Answer Set:',
    'BROWSE': 'Browse',
    'CANCEL': 'Cancel',
    'DELETE_ANSWER': 'Delete answer',
    'DELETE_ANSWER_TEXT': 'Are you sure, that you want to delete this answer and all its answer options?',
    'DELETE_ANSWER_OPTION': 'Delete answer option',
    'DELETE_ANSWER_OPTION_TEXT': 'Are you sure, that you want to delete this answer option?',
    'EXPORT': 'Export',
    'EXPORT_CSV':'Export as CSV',
    'EXPORT_EXCEL':'Export as Excel Workbook',
    'EXPORT_EXCEL_2003':'Export as Excel 2003 Workbook',
    'EXPORT_OPENDOCUMENT':'Export as OpenDocument Workbook',
    'IMPORT': 'Import',
    'IMPORT_MODE': 'Import mode',
    'IMPORT_MODE_INSERT': 'Only insert new answers',
    'IMPORT_MODE_OVERRIDE': 'Override answers if they exist',
    'LOADING': 'Loading...',
    'NO': 'No',
    'SEARCH': 'Search',
    'TAGS': 'Tags',
    'UPLOAD': 'Upload',
    'UPLOAD_ANSWERS': 'Upload answers',
    'UPLOAD_VARIABLES': 'Upload variables',
    'UPLOAD_ANSWERS_TEXT': 'Please choose the file of answers you want to import.',
    'UPLOAD_VARIABLES_TEXT': 'Please choose the file of variables you want to import.',
    'YES': 'Yes',
    'IMPORT_RUNNING': 'Import running',
    'IMPORT_ALREADY_RUNNING': 'Another import is already running. Please wait until it finished before issueing a new import',
    'IMPORT_ERRORS': 'Could not import the following answers because they are missing required properties:',
    'WAITING': 'Please wait or return later',

    // AnswerStore detail view
    'ADDITIONAL_PROPOSALS': 'Additional answer proposals',
    'ADDITIONAL_PROPOSALS_TOOLTIP': 'Additional answer proposals entered here are specific to this answer option and are added to the general answer proposals editable in the "Answer" view.',
    'ANSWER_PROPERTIES': 'Properties',
    'ANSWER_SEARCH_NOT_FOUND': 'There are no answer options for this search term.',
    'ANSWER_TEXT': 'Answer text',
    'CURRENT_TEXT': 'Current answer text:',
    'GENERAL_PROPOSALS': 'Answer proposals',
    'GENERAL_PROPOSALS_TOOLTIP': 'These answer proposals act as buttons for every option of this answer, that the user can click to answer with the text they contain.',
    'INVALID_NUMBER_TEXT_1': 'This value must be between',
    'INVALID_NUMBER_TEXT_2': 'and',
    'INVALID_NUMBER_TEXT_3': '.',
    'NEW_ANSWER_ID': 'New Answer ID',
    'NEW_ANSWER_TOOLTIP': 'To save this new answer, you also have to fill out the required fields of the first answer option.',
    'NEW_TEXT': 'New answer text:',
    'MEDIA': 'Media',
    'MODE_MARKDOWN': 'Markdown mode',
    'MODE_HTML': 'HTML mode',
    'MODE_WYSIWYG': 'WYSIWYG mode',
    'NOT_A_NUMBER_TEXT': 'This value must be a number.',
    'REQUIRED_TEXT': 'This field is required.',
    'SAVE': 'Save',
    'TOO_LONG_TEXT': 'This answer text exceeds the recommended text size.',

    // Versioning strings
    'ANSWER_VERSIONS': 'Versions',
    'AUTHOR': 'Author',
    'CURRENT_VERSION': 'Current version',
    'DISMISS': 'Dismiss',
    'NO_ANSWER_VERSIONS': 'There are no earlier versions of this answer',
    'PREVIEW_VERSION': 'Preview of version ',
    'RESTORE_VERSION': 'Restore',
    'SELECTED_VERSION': 'Selected version',
    'VERSION_DATE': 'Creation date',
    'VERSION_NUMBER': 'Version',
  });

  $translateProvider.translations('de', {
    // AnswerStore master view
    'ANSWERSTORE': 'Antwortenverwaltung',
    'ANSWER': 'Eigenschaften der Antwort',
    'ANSWEROPTION': 'Antwortmöglichkeit',
    'ANSWER_ID': 'Antwort ID',
    'ANSWER_NEW': 'Neue Antwort',
    'ANSWER_SET': 'Antwortenset:',
    'BROWSE': 'Durchsuchen',
    'CANCEL': 'Abbrechen',
    'DELETE_ANSWER': 'Antwort löschen',
    'DELETE_ANSWER_TEXT': 'Sind Sie sicher, dass Sie diese Antwort und alle ihre Antwortmöglichkeiten löschen möchten?',
    'DELETE_ANSWER_OPTION': 'Antwortmöglichkeit löschen',
    'DELETE_ANSWER_OPTION_TEXT': 'Sind Sie sicher, dass Sie diese Antwortmöglichkeit löschen möchten?',
    'EXPORT': 'Exportieren',
    'EXPORT_CSV':'Exportieren als CSV',
    'EXPORT_EXCEL':'Exportieren als Excel Arbeitsmappe',
    'EXPORT_EXCEL_2003':'Exportieren als Excel 2003 Arbeitsmappe',
    'EXPORT_OPENDOCUMENT':'Exportieren als OpenDocument Arbeitsmappe',
    'IMPORT': 'Importieren',
    'IMPORT_MODE': 'Importmodus',
    'IMPORT_MODE_INSERT': 'Nur neue Antworten übernehmen',
    'IMPORT_MODE_OVERRIDE': 'Antworten überschreiben, falls sie existieren',
    'LOADING': 'Lade...',
    'NO': 'Nein',
    'SEARCH': 'Suche',
    'TAGS': 'Tags',
    'UPLOAD': 'Hochladen',
    'UPLOAD_ANSWERS': 'Antworten hochladen',
    'UPLOAD_VARIABLES':'Variablern hochladen',
    'UPLOAD_ANSWERS_TEXT': 'Bitte wählen Sie die Datei mit Antworten aus, die Sie hochladen möchten.',
    'UPLOAD_VARIABLES_TEXT': 'Bitte wählen Sie die Datei mit Variablern aus, die Sie hochladen möchten.',
    'YES': 'Ja',
    'IMPORT_RUNNING': 'Import wird ausgeführt',
    'IMPORT_ALREADY_RUNNING': 'Es wird bereits ein Import ausgeführt. Bitte warten Sie, bis dieser abgeschlossen ist.',
    'IMPORT_ERRORS': 'Die folgenden Antworten konnten nicht importiert werden, da verpflichtende Eigenschaften fehlen:',
    'WAITING': 'Bitte warten Sie oder kommen Sie später wieder',

    // AnswerStore detail view
    'ADDITIONAL_PROPOSALS': 'Zusätzliche Antwortvorschläge',
    'ADDITIONAL_PROPOSALS_TOOLTIP': 'Die hier eingetragenen zusätzlichen Antwortvorschläge gelten nur für diese Antwortmöglichkeit und werden zu den generellen Antowrtvorschlägen hinzugefügt, die in der "Antwort"-Ansicht bearbeitet werden können.',
    'ANSWER_PROPERTIES': 'Eigenschaften',
    'ANSWER_SEARCH_NOT_FOUND': 'Für diese Suche wurden keine Antwortmöglichkeiten gefunden.',
    'ANSWER_TEXT': 'Antworttext',
    'CURRENT_TEXT': 'Aktueller Antworttext:',
    'GENERAL_PROPOSALS': 'Antwortvorschläge',
    'GENERAL_PROPOSALS_TOOLTIP': 'Diese Antwortvorschläge gelten für jede Antwortmöglichkeit dieser Antwort und werden dem Chatnutzer als Buttons dargestellt, auf die er klicken kann, um mit dem entsprechenden Text zu antworten.',
    'INVALID_NUMBER_TEXT_1': 'Dieser Wert muss zwischen',
    'INVALID_NUMBER_TEXT_2': 'und',
    'INVALID_NUMBER_TEXT_3': 'liegen.',
    'NEW_ANSWER_ID': 'Neue Antwort ID',
    'NEW_ANSWER_TOOLTIP': 'Um diese neue Antwort zu speichern, müssen sie auch die Pflichtfelder der ersten Antwortmöglichkeit ausfüllen.',
    'NEW_TEXT': 'Neuer Antworttext:',
    'MEDIA': 'Medien',
    'MODE_MARKDOWN': 'Markdown-Modus',
    'MODE_HTML': 'HTML-Modus',
    'MODE_WYSIWYG': 'WYSIWYG-Modus',
    'NOT_A_NUMBER_TEXT': 'Dieser Wert muss eine Zahl sein.',
    'REQUIRED_TEXT': 'Dies ist ein Pflichtfeld.',
    'SAVE': 'Speichern',
    'TOO_LONG_TEXT': 'Dieser Antworttext überschreitet die empfohlene Textlänge.',

    // Versioning strings
    'ANSWER_VERSIONS': 'Versionen',
    'AUTHOR': 'Autor',
    'CURRENT_VERSION': 'Aktuelle Version',
    'DISMISS': 'Schließen',
    'NO_ANSWER_VERSIONS': 'Es gibt keine früheren Versionen dieser Antwort',
    'PREVIEW_VERSION': 'Vorschau der Version ',
    'RESTORE_VERSION': 'Wiederherstellen',
    'SELECTED_VERSION': 'Ausgewählte Version',
    'VERSION_DATE': 'Erstellungsdatum',
    'VERSION_NUMBER': 'Version'
  });
}]);
