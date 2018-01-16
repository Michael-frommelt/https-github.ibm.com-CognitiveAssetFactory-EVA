/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('eva.answerStore').controller('AnswerStoreCtrl', ['$scope', '$interval', '$location', '$route', '$translate', '$uibModal', '$window', '$http', 'AnswerStoreService',
  function($scope, $interval, $location, $route, $translate, $uibModal, $window, $http, AnswerStoreService) {
    // Handling multiple Clients
    $scope.currentAnswerSetId = $window.sessionStorage.getItem('currentAnswerSetId') || '';
    $scope.searchText = $window.sessionStorage.getItem('answerSearchText') || '';

    $scope.availableAnswerSets = [];
    $scope.answers = [];
    $scope.answersExpanded = [];
    $scope.isSearchExpanded = false;
    $scope.error = null;
    $scope.isLoading = true;
    var importNotPossible = "You can't import new files, while another import is still running. Please try again later."

    // Controller setup

    $scope.$on('$routeChangeSuccess', function() {
      $http({
        method: "GET",
        url: '/api/answer/importRunning'
      }).then(function(response) {
        if (response.data.importRunning) {
          $scope.importInProgress = true;
        } else $scope.importInProgress = false;
      });
    });

    AnswerStoreService.getAnswerSets().then(function(answerSets) {
      var isInAvailableAnswerSets = false;
      for (var i = 0; i < answerSets.length; i++) {
        if (answerSets[i].id === $scope.currentAnswerSetId) {
          isInAvailableAnswerSets = true;
        }
      }

      $scope.availableAnswerSets = answerSets;
      if (!isInAvailableAnswerSets) {
        $scope.currentAnswerSetId = answerSets[0].id;
      }
    }).then(function() {
      $scope.onSetChange();
    }, handleError);

    // Expanding all nodes if search is used
    $scope.onSearch = function() {
      var shouldExpand = false;
      if ($scope.searchText) {
        shouldExpand = true;
      }

      if ($scope.isSearchExpanded === !shouldExpand) {
        for (var i = 0; i < $scope.answersExpanded.length; i++) {
          $scope.answersExpanded[i] = shouldExpand;
        }
      }
      $scope.isSearchExpanded = shouldExpand;
      $window.sessionStorage.setItem('answerSearchText', $scope.searchText);
    };


    // watch for loading
    $scope.$watch('isLoading', function() {
      if ($scope.isLoading == true) {
        blur = document.getElementsByClassName("blur_hide");
        blur.className = "ng-show";
        // hide display
      } else {
        blur = document.getElementById("blur_hide");
        blur.style.opacity = 0;
        blur.style.visibility = "hidden";
      }
    });

    // Scope Functions
    $scope.onSetChange = function() {
      $scope.isLoading = true;
      AnswerStoreService.getAnswers($scope.currentAnswerSetId).then(function(answers) {
        $scope.answers = answers;
        $window.sessionStorage.setItem('currentAnswerSetId', $scope.currentAnswerSetId);

        for (var i = 0; i < $scope.answers.length; i++) {
          $scope.answersExpanded[i] = $scope.answersExpanded[i] || false;
        }
        // retrigger the search on the new set by modifying the searchText
        $scope.searchText = ' ' + $scope.searchText;
        $scope.searchText = $scope.searchText.trim();
        $scope.onSearch();
        $scope.isLoading = false;
      }, handleError);
    };

    $scope.newAnswer = function() {
      $location.path('/admin/answerStore/' + encodeURIComponent($scope.currentAnswerSetId) + '/_new_');
    };

    $scope.editAnswer = function(answerId) {
      $location.path('/admin/answerStore/' + encodeURIComponent($scope.currentAnswerSetId) + '/' + encodeURIComponent(answerId));
    };

    $scope.newAnswerOption = function(answer) {
      $location.path('/admin/answerStore/' + encodeURIComponent($scope.currentAnswerSetId) + '/' + encodeURIComponent(answer.answerId) + '/' + answer.answerOptions.length);
    };

    $scope.editAnswerOption = function(answerId, answerOptionIndex) {
      $location.path('/admin/answerStore/' + encodeURIComponent($scope.currentAnswerSetId) + '/' + encodeURIComponent(answerId) + '/' + answerOptionIndex);
    };

    $scope.openDeleteModal = function(answerId, answerOption) {
      $uibModal.open({
        templateUrl: 'deleteModal.html',
        scope: $scope,
        controller: ['$scope', function($scope) {
          if (answerOption) {
            $scope.deleteMode = 'answerOption';
          } else {
            $scope.deleteMode = 'answer';
          }
          $scope.isDeleting = false;

          $scope.deleteAnswerOrOption = function() {
            $scope.isDeleting = true;
            var promise;
            if ($scope.deleteMode === 'answerOption') {
              promise = $scope.deleteAnswerOption(answerId, answerOption);
            } else {
              promise = $scope.deleteAnswer(answerId);
            }
            promise.catch(handleError).finally(function() {
              $scope.isDeleting = false;
              $scope.$dismiss();
            });
          };
        }]
      }).result.catch(function() {});
    };

    $scope.deleteAnswer = function(answerId) {
      return AnswerStoreService.deleteAnswer($scope.currentAnswerSetId, answerId).catch(handleError);
    };

    $scope.deleteAnswerOption = function(answerId, answerOption) {
      return AnswerStoreService.getAnswer($scope.currentAnswerSetId, answerId).then(function(answer) {
        for (var i = 0; i < answer.answerOptions.length; i++) {
          if (answer.answerOptions[i].answerText === answerOption.answerText) {
            answer.answerOptions.splice(i, 1);
            break;
          }
        }
        $route.reload();
        return AnswerStoreService.saveAnswer($scope.currentAnswerSetId, answer);
      }).catch(handleError);
    };

    $scope.openImportModal = function() {
      $http({
        method: "GET",
        url: '/api/answer/importRunning'
      }).then(function(response) {
        if (response.data.importRunning) {
          $scope.importInProgress = true;
          $scope.error = {
            data: {message: importNotPossible}
          };
        } else {
          $scope.importInProgress = false;
          $uibModal.open({
            templateUrl: 'importModal.html',
            scope: $scope,
            controller: ['$scope', 'ConfigService', function($scope, ConfigService) {
              $scope.uploadFile = null;
              $scope.uploadMode = false;
              $scope.isImporting = false;
              $scope.maxSize = '500 MB';

              ConfigService.getConfig('answerStore').then(function(config) {
                if (config.fileSizeLimit) {
                  $scope.maxSize = config.fileSizeLimit * 1024;
                }
              });
              $scope.importFile = function() {
                $scope.isImporting = true;
                $scope.importInProgress = true;
                $scope.importAnswers($scope.uploadFile, $scope.uploadMode, function() {
                  $scope.isRunningImport(function() {
                    $scope.importInProgress = false;
                    $scope.isImporting = false;
                    $scope.$dismiss();
                  });
                });
              };
            }]
          }).result.catch(function() {});
        };
      });
    }

    $scope.importAnswers = function(uploadFile, uploadMode, callback) {
      $scope.importStatus = "";
      AnswerStoreService.importAnswers($scope.currentAnswerSetId, uploadFile, uploadMode);
      callback();
    };

    $scope.isRunningImport = function(callback) {
      $http({
        method: "GET",
        url: '/api/answer/importRunning'
      }).then(function(response) {
        if (response.data.importRunning) {
          $scope.importInProgress = true;
          var status = $interval(function() {
            $http({
              method: "GET",
              url: '/api/answer/status'
            }).then(function(response) {
              $scope.importProgress = response.data.importProgress;
              $scope.importStatus = response.data.status;
              if (response.data.status === "finished") {
                $scope.importInProgress = false;
                $scope.isImporting = false;
                $scope.importStatus = "";
                $interval.cancel(status);
                callback();
              }
            }, function(error) {
              $scope.error = error;
              console.log(error);
              $scope.importStatus = "failed"
              $scope.importInProgress = false;
              $scope.isImporting = false;
              $interval.cancel(status);
              callback();
            });
          }, 7000);
        } else $scope.importInProgress = false;
      })
    };

    $scope.exportAnswers = function(fileType) {
      AnswerStoreService.exportAnswers($scope.currentAnswerSetId, fileType, $translate.use());
    };

    function handleError(error) {
      console.log(error);
      $scope.error = error;
    }
  }
]);
