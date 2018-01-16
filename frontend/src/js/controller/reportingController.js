/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main')
// Reporting controller setup
.controller('ReportingCtrl', ['$filter', '$interval', '$scope', '$uibModal', '$window', 'conversationService', 
  function($filter, $interval, $scope, $uibModal, $window, conversationService) {
    $scope.dataFromReportingTable = {};
    $scope.statistics = [];
    $scope.statisticsLoading = false;
    $scope.isLoading = true;
    $scope.exportProgress = null;
    var exportProgressInterval = null;

    $scope.labels = ["Download Sales", "In-Store Sales", "Mail-Order Sales"];
    $scope.data = [300, 500, 100];

    $scope.answerFromBarData = [];
    $scope.answerFromBarLabels = [];

    $scope.tableDefinition = {
      maxEntriesPerPage: "25",
      defaultSorting: {
        columnId: "created"
      },
      columnDefs: [{
        id: 'conversationId',
        name: 'Conversation ID',
        active: false,
        filter: 'text'
      }, {
        id: 'clientId',
        name: 'Client ID',
        active: true,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'username',
        name: 'Username',
        active: true,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'originalQuestion',
        name: 'Not Modified Question',
        active: false
      }, {
        id: 'question',
        name: 'Question',
        active: true
      }, {
        id: 'answer',
        name: 'Answer',
        active: true
      }, {
        id: 'longAnswerId',
        name: 'Long Answer ID',
        active: true
      }, {
        id: 'answerFrom',
        name: 'Answer From',
        active: false,
        filter: 'text'
      }, {
        id: 'feedback',
        name: 'Feedback',
        active: true,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'comment',
        name: 'User Comment',
        active: true
      }, {
        id: 'reason',
        name: 'Reason',
        active: true,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'topIntent',
        name: 'Top Intent',
        active: false
      }, {
        id: 'topConfidence',
        name: 'Confidence',
        active: false,
        filter: 'percent',
        type: 'percent',
      }, {
        id: 'entityString',
        name: 'Entities',
        active: false
      }, {
        id: 'updated',
        name: 'Updated',
        active: false,
        type: 'date',
        filter: 'date'
      }, {
        id: 'created',
        name: 'Created',
        active: true,
        type: 'date',
        filter: 'date'
      }],
      clickEvents: {
        tr: function(rowData) {
          $uibModal.open({
            templateUrl: 'additionalInfo.html',
            controller: ['$scope', function($scope) {
              $scope.questionText = rowData.question;
              $scope.answerText = rowData.answer;
            }],
          }).result.catch(function() {});
        }
      },
    };

    var getFeedback = function(filter, limit, page, sorting, callback) {
      $scope.getFeedbackInAction = true;
      conversationService.getFeedback(filter, limit, page, sorting)
        .then(function(data) {
          return callback(data);
        }, function(data) {
          $scope.errorText = data;
        });
    };

    var countFeedback = function(filter, callback) {
      $scope.getFeedbackInAction = true;
      conversationService.countFeedback(filter)
        .then(function(data) {
          callback(data);
        }, function(data) {
          $scope.errorText = data;
          callback(0);
        });
    };

    var distinctFeedback = function(columnDef, callback) {
      var columnId = columnDef.id;
      conversationService.distinctFeedback(columnId)
        .then(function(data) {
          callback(columnDef, data);
        }, function(data) {
          $scope.errorText = data;
          callback([]);
        });
    };

    function getStringFromTimestamp(timestamp) {
      var d = moment(moment(timestamp).format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ'));
      var dateString = d.format('DD') + '.' + d.format('MM') + '.' + d.format('YYYY') + ' ' + d.format('HH') + ':' + d.format('mm') + ':' + d.format('ss');
      return dateString;
    }

    $scope.generateFeedbackExport = function(filter, sorting) {
      $scope.exportProgress = 0;
      conversationService.generateFeedbackExport(filter, sorting).then(function() {
        getExportProgress(true);
      }, function() {
        $scope.exportProgress = null;
      });
    };

    $scope.cancelFeedbackExport = function() {
      $interval.cancel(exportProgressInterval);
      conversationService.cancelFeedbackExport().then(function() {
        $scope.exportProgress = null;
      });
    };

    $scope.downloadFeedbackExport = function() {
      $window.open('/api/feedback/export/download');
    };

    function getExportProgress(downloadOnFirstCall) {
      conversationService.getFeedbackExportProgress().then(function(progress) {
        if (progress === null) return;
        
        $scope.exportProgress = progress;
        
        if (progress === 100) {
          if (downloadOnFirstCall) $scope.downloadFeedbackExport();
          return;
        }
        
        exportProgressInterval = $interval(function() {
          conversationService.getFeedbackExportProgress().then(function(progress) {
            $scope.exportProgress = progress;
            if (progress === 100) {
              $interval.cancel(exportProgressInterval);
              $scope.downloadFeedbackExport();
            }
          }, function(data) {
            $scope.errorText = data;
          });
        }, 2000);
      }, function(data) {
        $scope.errorText = data;
      });
    }
    getExportProgress(false);
    $scope.$on('$destroy', function() {
      $interval.cancel(exportProgressInterval);
    });

    $scope.exportStatisticsData = function() {
      var statistics = $scope.statistics;
      var CSV = '';
      var separator = ';';

      var activeFilters = $scope.dataFromReportingTable.filter;
      var activeFiltersCSV = '';
      for(var index in activeFilters) {
        var currentFilter = activeFilters[index];
        if(currentFilter === undefined) continue;
        var line = '';
        line += index;
        line += separator;
        switch(currentFilter.type) {
          case 'number_gt':
            line += '> ' + currentFilter.value;
            break;
          case 'number_lt':
            line += '< ' + currentFilter.value;
            break;
          case 'number_between':
            // date atm
            var dates = currentFilter.value.split('-');
            var from = $filter('date')(dates[0],"dd.MM.yy HH:mm:ss");
            var to = $filter('date')(dates[1],"dd.MM.yy HH:mm:ss");
            line += 'From:' + separator + from + separator + 'To:' + separator + to;
            break;
          default:
            line += currentFilter.value;
        }
        line += '\n';
        activeFiltersCSV += line;
      }
      if(activeFiltersCSV.length > 0) {
        var activeFilterFirstLine = 'Active filters:\n';
        CSV += activeFilterFirstLine;
        CSV += activeFiltersCSV;
        CSV += 'Statistics:\n';
      }

      var firstLine = '"Client ID"' + separator + '"Count Positive"' + separator + '"Percent Positive"' + separator + '"Count Negative"' + separator + '"Count Done Negative"' + separator + '"Percent Done Negative"\n';
      CSV += firstLine;
      for(var index in $scope.statistics) {
        var statistic = $scope.statistics[index];
        var line = '';
        line += '"' + statistic.clientId + '"' + separator
          + statistic.cnt_pos + '' + separator
          + statistic.per_pos + '' + separator
          + statistic.cnt_neg + '' + separator
          + statistic.per_neg + '' + separator
          + statistic.cnt_done + '' + separator
          + statistic.per_done + '\n';
        CSV += line;
      }

      var file = new Blob([ CSV ], {
        type : 'text/csv'
      });
      //trick to download store a file having its URL
      var fileURL = URL.createObjectURL(file);
      var a         = document.createElement('a');
      a.href        = fileURL;
      a.target      = '_blank';
      a.download    = 'statistics.csv';
      document.body.appendChild(a);
      a.click();
    };

    // wait page to load
    var waitLoading = function () {
       setTimeout(function(){
         $scope.isLoading = false;
         var blur = document.getElementById("blur_hide");
         blur.style.opacity = 0;
         blur.style.visibility = "hidden";
       },
       5000);
    };
    waitLoading();

    // watch for loading
    $scope.$watch('isLoading', function() {
        if($scope.isLoading == true) {
          var blur = document.getElementsByClassName("blur_hide");
          blur.className = "ng-show";
          // hide display
        } else {
          var blur = document.getElementById("blur_hide");
          blur.style.opacity = 0;
          blur.style.visibility = "hidden";
        }
    });

    $scope.contentQueries = {};
    $scope.contentQueries.getFeedback = getFeedback;
    $scope.contentQueries.countFeedback = countFeedback;
    $scope.contentQueries.getSelectFilterValues = distinctFeedback;
}]);