/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var conversationFeedback = angular.module('eva.conversationFeedback', []);

conversationFeedback.config(['$translateProvider', function($translateProvider) {
  // I18N setup
  $translateProvider.translations('en', {
    'CLIENT_ID': 'Client ID',
    'COMMENT': 'User Comment',
    'CONVERSATION_FEEDBACK': 'Conversation Feedback',
    'CONVERSATION_ID': 'Conversation ID',
    'CREATED': 'Created at',
    'FEEDBACK': 'Feedback',
    'RATING': 'Rating',
    'USERNAME': 'Username',
    'CLOSE': 'Close',
  });

  $translateProvider.translations('de', {
    'CLIENT_ID': 'Mandanten-ID',
    'COMMENT': 'Nutzerkommentar',
    'CONVERSATION_FEEDBACK': 'Konversationsfeedback',
    'CONVERSATION_ID': 'Konversations-ID',
    'CREATED': 'Erstellt am',
    'FEEDBACK': 'Feedback',
    'RATING': 'Bewertung',
    'USERNAME': 'Nutzername',
    'CLOSE': 'Schließen',
  });
}]);