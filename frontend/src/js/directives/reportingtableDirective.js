/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main')

.directive('reportingTable', ['$timeout', '$interval', function($timeout, $interval) {
  return {
    scope: {
      definition: '=',
      contentQueries: '=',
      output: '='
    },
    restrict: 'AE',
    replace: 'true',
    templateUrl: 'views/directives/reportingTable.html',
    link: function(scope, elem, attrs) {
      scope.activeFilter = {};
      scope.applyFilterLastCalled = 0;
      scope.applyMaxEntriesPerPageLastCalled = 0;
      scope.applyMaxEntriesPerPageTimeoutValue = 500;
      scope.applyPageLastCalled = 0;
      scope.applyPageTimeoutValue = 500;
      scope.applyFilterTimeoutValue = 1000;
      scope.selectFilterShowAll = "show_all_123";
      scope.rowsCount = 0;
      scope.page = 1;
      scope.pages = 0;
      scope.content = [];
      scope.sortData = {};
      scope.isLoading = true;

      function contains(array, obj) {
        var i = array.length;
        while (i--) {
          if (array[i] == obj) {
            return true;
          }
        }
        return false;
      }

	  var definition = scope.definition;
      var columnDefs = definition.columnDefs;


      if(definition.defaultSorting && definition.defaultSorting.columnId) {
        scope.sortData.id = definition.defaultSorting.columnId;
        if(definition.defaultSorting.order) {
          scope.sortData.order = definition.defaultSorting.order;
        } else {
          scope.sortData.order = 'desc';
        }
      }

      for(var i in columnDefs) {
        var columnDef = columnDefs[i];
        if(columnDef.filter === "select") {
          scope.activeFilter[columnDef.id] = scope.selectFilterShowAll;
          if(columnDef.filterAutoSelect) {
            scope.contentQueries.getSelectFilterValues(columnDef, function(columnDef, results) {
              columnDef.filterOptions = results;
            });
          }
        }
      }

      if(definition.maxEntriesPerPage === undefined) {
        definition.maxEntriesPerPage = "25";
      }

      scope.sortTable = function(columnId) {
        if(scope.sortData.id === columnId) {
          if(scope.sortData.order === 'asc') {
            scope.sortData.order = 'desc';
          } else {
            scope.sortData.order = 'asc';
          }
        } else {
          scope.sortData.id = columnId;
          scope.sortData.order = 'desc';
        }
        scope.page = 1;
        loadContent();
      };

      scope.nextPage = function() {
        if(scope.page < scope.pages) {
          scope.page++;
          loadContent();
        }
      };

      scope.lastPage = function() {
        if(scope.page > 1) {
          scope.page--;
          loadContent();
        }
      };

      function loadContent() {
        scope.contentQueries.getFeedback(scope.output.filter, definition.maxEntriesPerPage, scope.page, scope.sortData, function(result) {
          scope.content = result;
        });
        scope.contentQueries.countFeedback(scope.output.filter, function(count) {
          scope.rowsCount = count;
          scope.pages = Math.ceil(scope.rowsCount / definition.maxEntriesPerPage);
        });

      }

      function getColumnDefById(id) {
        for(var index in columnDefs) {
          if(columnDefs[index].id === id) {
            return columnDefs[index];
          }
        }
        return undefined;
      }

      function handlePercentFilter(percentFilter) {
        if(percentFilter.percent && percentFilter.percent !== "") {
          var type = 'number_gt';
          if(percentFilter.order) {
            if(percentFilter.order === "lessThan") {
              type = 'number_lt';
            } else if(percentFilter.order === "equals") {
              type = 'number_equals';
            }
          }

          percentFilter.percent = percentFilter.percent.replace(",", ".").replace("%", "");
          var percent = parseFloat(percentFilter.percent)/100;
          return {type: type, value: percent};
        }

        return undefined;
      }

      function handleDateFilter(dateFilter) {
        if(dateFilter.startDate && dateFilter.endDate) {
          var type = 'number_between';

          var startDate = moment(dateFilter.startDate, "DD.MM.YYYY").valueOf();
          var endDate = moment(dateFilter.endDate, "DD.MM.YYYY").valueOf();
          endDate = endDate + 86400000 - 1; // Bis Ende des Tages: +24h -1ms
          var dateFromTo = startDate + '-' + endDate;

          return {type: type, value: dateFromTo};
        }

        return undefined;
      }


      scope.applyFilter = function() {
        var thisCall = new Date().getTime();
        scope.applyFilterLastCalled = thisCall;
        $timeout(function() {
          if(scope.applyFilterLastCalled === thisCall) {
            var filterForQuery = {};
            for(var index in scope.activeFilter) {
              var columnDef = getColumnDefById(index);
              var filter = {};
              if(columnDef.filter === 'percent') {
                filter = handlePercentFilter(scope.activeFilter[index]);
              } else if(columnDef.filter === 'date') {
                filter = handleDateFilter(scope.activeFilter[index]);
              } else {
                var value = scope.activeFilter[index];
                if(value === "false") value = false;
                if(value === scope.selectFilterShowAll || value === "") continue;
                var type = columnDef.filter === 'text' ? 'like' : 'exact';
                filter = {type: type, value: value};
              }
              filterForQuery[index] = filter;
            }
            scope.output.filter = filterForQuery;
            scope.page = 1;
            loadContent();
          }
        }, scope.applyFilterTimeoutValue);
      };

      scope.applyMaxEntriesPerPage = function() {
        var thisCall = new Date().getTime();
        scope.applyMaxEntriesPerPageLastCalled = thisCall;
        $timeout(function() {
          if(scope.applyMaxEntriesPerPageLastCalled === thisCall) {
            scope.page = 1;
            loadContent();
          }
        }, scope.applyMaxEntriesPerPageTimeoutValue);
      };

      scope.applyPage = function() {
        var thisCall = new Date().getTime();
        scope.applyPageLastCalled = thisCall;
        $timeout(function() {
          if(scope.applyPageLastCalled === thisCall) {
            if(parseInt(scope.page) > parseInt(scope.pages)) scope.page = scope.pages;
            if(parseInt(scope.page) < 1) scope.page = 1;
            loadContent();
          }
        }, scope.applyPageTimeoutValue);
      };


      scope.changeColumn = function(columnId) {
        var column = getColumnDefById(columnId);
        if(!column.active && column.filter && column.filter !== "none" && scope.activeFilter[columnId]) {
          if(column.filter === "select" && scope.activeFilter[columnId] !== scope.selectFilterShowAll) {
            scope.activeFilter[columnId] = scope.selectFilterShowAll;
            scope.applyFilter();
          } else if(scope.activeFilter[columnId] !== ""){
            delete(scope.activeFilter[columnId]);
            scope.applyFilter();
          }
        }
      };

      loadContent();

      if(definition.autorefresh !== undefined) {
        $interval(function() {
          loadContent();
        }, (parseInt(definition.autorefresh)*1000));
      }

      scope.output.refresh = function() {
        console.log("refresh table");
        loadContent();
      };

      scope.output.toggleFilters = function() {
        $(".filters").slideToggle("fast");
      };

      scope.output.sorting = scope.sortData;
    }
  };
}]);
