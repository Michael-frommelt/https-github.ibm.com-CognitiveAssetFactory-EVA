/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('eva.answerStore').filter('highlightFilter', function() {
  return function(input, query) {
    if (input == null || query == null || query.trim() === '') {
      return input;
    }
    return input.replace(new RegExp('('+query+')(?![^<]*?>)', 'gi'), '<span class="bold">$1</span>');
  }
});

angular.module('eva.answerStore').filter('answerFilter', ['$filter', function($filter) {
  return function(input, predicate) {
    var searchValue = predicate['$'];

    var answerPredicate = function(answer) {
      if (typeof searchValue === 'undefined') {
        return true;
      }
      searchValue = searchValue.toLowerCase();

      if (answer.answerId.toLowerCase().indexOf(searchValue) > -1) {
        return true;
      }

      if (Array.isArray(answer.tags) && answer.tags.join(', ').toLowerCase().indexOf(searchValue) > -1) {
        return true;
      }

      for (var i = 0; i < answer.answerOptions.length; i++) {
        if (answer.answerOptions[i].answerText.toLowerCase().indexOf(searchValue) > -1) {
          return true;
        }
        if (Array.isArray(answer.answerOptions[i].tags) && answer.answerOptions[i].tags.join(', ').toLowerCase().indexOf(searchValue) > -1) {
          return true;
        }
      }

      return false;
    };

    return $filter('filter')(input, answerPredicate, false);
  };
}]);

angular.module('eva.answerStore').directive('modelStSearch', ['stConfig', '$timeout', function(stConfig, $timeout) {
  // Like st-search, but relies on the value of ng-model to trigger changes.
  return {
    require: ['^stTable', 'ngModel'],
    link: function(scope, element, attr, ctrls) {
      var tableCtrl = ctrls[0];
      var modelCtrl = ctrls[1];
      var promise = null;
      var throttle = attr.stDelay || stConfig.search.delay;

      function triggerSearch() {
        var value = modelCtrl.$modelValue;

        if (promise !== null) {
          $timeout.cancel(promise);
        }

        promise = $timeout(function() {
          tableCtrl.search(value, attr.mhSearch || '');
          promise = null;
        }, throttle);
      }

      scope.$watch(function() { return modelCtrl.$modelValue; }, triggerSearch);
    }
  };
}]);