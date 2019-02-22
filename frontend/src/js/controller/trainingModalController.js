/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
angular.module('main')
.controller('TrainingModalCtrl', ['$uibModalInstance', 'conversationService', 'feedbackRow',
  function ($uibModalInstance, conversationService, feedbackRow) {
    var $ctrl = this;

    $ctrl.feedbackRow = feedbackRow;

    $ctrl.update = function() {
      $ctrl.updatedFeedback = {};
      if($ctrl.feedbackRow.feedback) {
        $ctrl.updatedFeedback.feedback = $ctrl.feedbackRow.feedback;
      } else {
        $ctrl.updatedFeedback.feedback = "false";
      }
      if($ctrl.feedbackRow.adminComment) {
        $ctrl.updatedFeedback.adminComment = $ctrl.feedbackRow.adminComment;
      } else {
        $ctrl.updatedFeedback.adminComment = "";
      }
      if($ctrl.feedbackRow.status) {
        $ctrl.updatedFeedback.status = $ctrl.feedbackRow.status.toString();
      } else {
        $ctrl.updatedFeedback.status = "0";
      }
    }
    $ctrl.update();

    var filter = {
      conversationId: {
        type: 'exact',
        value: $ctrl.feedbackRow.conversationId
      }
    }
    conversationService.getFeedback(filter)
      .then(function(data) {
        $ctrl.conversation = data;
      }, function(data) {
        $ctrl.errorText = data;
      });

    $ctrl.save = function () {
      if($ctrl.updatedFeedback.feedback === "false") {
        $ctrl.updatedFeedback.feedback = false;
      }
      $ctrl.updatedFeedback.status = parseInt($ctrl.updatedFeedback.status);

      conversationService.updateFeedback($ctrl.feedbackRow._id, $ctrl.updatedFeedback)
        .then(function(data) {
          $uibModalInstance.close(true);
        }, function(data) {
          $uibModalInstance.close(false);
        });
    };

    $ctrl.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    $ctrl.changeTo = function(messageId) {
      var searchedEntry = undefined;
      for(var index in $ctrl.conversation) {
        var entry = $ctrl.conversation[index];
        if(entry.messageId === messageId) {
          searchedEntry = entry;
        }
      }

      $ctrl.feedbackRow = searchedEntry;
      $ctrl.update();
    };

    $ctrl.delete = function() {
      conversationService.deleteFeedback($ctrl.feedbackRow._id)
        .then(function(data) {
          $uibModalInstance.close(true);
        }, function(data) {
          $uibModalInstance.close(false);
        });
    };
  }
]);
