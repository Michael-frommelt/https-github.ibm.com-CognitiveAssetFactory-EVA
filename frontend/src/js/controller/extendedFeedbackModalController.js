/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main')
.controller('ExtFeedbackModalCtrl', ['$uibModalInstance', 'conversationService', 'ConfigService', 'feedbackRow',
  function ($uibModalInstance, conversationService, ConfigService, feedbackRow) {
    var $ctrl = this;

    $ctrl.feedbackRow = feedbackRow;
    $ctrl.no_answer = feedbackRow.no_answer;
    $ctrl.updatedFeedback = {};
    $ctrl.updatedFeedback.reason = "false";
    $ctrl.updatedFeedback.comment = $ctrl.feedbackRow.answer.comment;
    $ctrl.updatedFeedback.messageId = $ctrl.feedbackRow.answer.messageId;

    if($ctrl.no_answer) {
      $ctrl.updatedFeedback.reason = "Keine Antwort";
    }

    ConfigService.getExtendedFeedbackConfig()
      .then(function(data) {
        $ctrl.extFeedbackConfig = data;
        console.log($ctrl.extFeedbackConfig);
      }, function(data) {
        $ctrl.errorText = data;
        console.log($ctrl.errorText);
      });

    function check() {
      if(!$ctrl.updatedFeedback.comment || $ctrl.updatedFeedback.comment === "" || $ctrl.updatedFeedback.comment.length <= 0) {
        return false;
      }
      if($ctrl.updatedFeedback.reason === "false") return false;
      return true;
    }

    $ctrl.save = function () {
      /* if(!check()) {
        $ctrl.errorText = "Es wurden nicht alle notwendigen Felder ausgefüllt.";
        return;
      } */
      $ctrl.updatedFeedback.feedback = "negative";
      $ctrl.updatedFeedback.reason = $ctrl.updatedFeedback.reason === "false" ? undefined : $ctrl.updatedFeedback.reason;

      $uibModalInstance.close($ctrl.updatedFeedback);
    };

    $ctrl.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  }
]);
