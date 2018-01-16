/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var statistics = angular.module('eva.statistics', [
    'angular.chips',
    'ngFileUpload',
    'pascalprecht.translate',
    'smart-table',
    'ui.bootstrap'
]);

statistics.config(['$translateProvider', function($translateProvider) {

    $translateProvider.translations('en', {
        'LOADING': 'Loading... Please Wait',
        'NODATA': 'No Data!',
        'FILTER_NOTE': 'Optional Configuration for the Diagrams below',
        'ACTIVE_FILTERS': 'Active Filters',
        'FEEDBACK_ABS': 'Feedback per Client:',
        'FEEDBACK_PERCENT': 'Feedback per Client (in Percent):',
        'COUNT_UND': 'Count Undefined',
        'COUNT_POS': 'Count Positive',
        'COUNT_NEG': 'Count Negative',
        'CONV_STATISTIC': 'Conversations Statistic',
        'MSG_STATISTIC': 'Messages Statistic',
        'TODAY': "Today",
        'WEEK': "This Week",
        'MONTH': 'This Month',
        'CONV': 'Conversations',
        'MSG': 'Messages',
        'MSG_PER_USER': 'Messages per User',
        'MORE_VALS': 'More Values',
        'QUITRATE': 'Quitrate (< 3 messages)',
        'DAILY_CONV': 'Daily Conversations Trend (Average):',
        'WEEKLY_CONV': 'Weekly Conversations Trend (Average):',
        'LONGTERM_CONV': 'Longterm Conversations Trend (Absolute):',
        'TOP_INTENTS': '10 Top Intents (in Percent):',
        'ANSWER_FROM': 'Answer From (in Percent):',
        'USERS': 'Users',
        'SEL_INTERVAL': 'Selected Interval'
    });

    $translateProvider.translations('de', {
        'LOADING': 'Ladevorgang... Bitte Warten',
        'NODATA': 'Keine Daten!',
        'FILTER_NOTE': 'Optionale Anpassung der Diagramme.',
        'ACTIVE_FILTERS': 'Aktive Filter',
        'FEEDBACK_ABS': 'Feedback pro Client:',
        'FEEDBACK_PERCENT': 'Feedback pro Client (in Prozent):',
        'COUNT_UND': 'Anzahl Undefined',
        'COUNT_POS': 'Anzahl Positiv',
        'COUNT_NEG': 'Anzahl Negativ',
        'CONV_STATISTIC': 'Konversationsstatistik (Absolut):',
        'MSG_STATISTIC': 'Nachrichtenverteilung (Absolut):',
        'TODAY': "Heute",
        'WEEK': "Diese Woche",
        'MONTH': 'Diesen Monat',
        'CONV': 'Konversationen',
        'MSG': 'Nachrichten',
        'MSG_PER_USER': 'Nachrichten pro Nutzer',
        'MORE_VALS': 'Weitere Werte',
        'QUITRATE': 'Abbrecherquote (< 3 Nachrichten)',
        'DAILY_CONV': 'Konversationen Tagesverlauf (Durchschnitt):',
        'WEEKLY_CONV': 'Konversationen Wochenverlauf (Durchschnitt):',
        'LONGTERM_CONV': 'Konversationen Langzeitverlauf (Absolut):',
        'TOP_INTENTS': '10 häufigste Intents (in Prozent):',
        'ANSWER_FROM': 'Answer From (in Prozent):',
        'USERS': 'Nutzer',
        'SEL_INTERVAL': 'Ausgewählte Zeitspanne'
    });
}]);
