/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main').directive('modelArrayEmptyValidator', function() { 
  return {
    require: 'ngModel',
    link: function(scope, elem, attr, ngModel) {
      // DOM -> model validation
      ngModel.$parsers.unshift(function(value) {
        var valid = Array.isArray(value) && value.length !== 0;
        ngModel.$setValidity('modelArrayEmpty', valid);
        return valid ? value : undefined;
      });

      // model -> DOM validation
      ngModel.$formatters.unshift(function(value) {
        ngModel.$setValidity('modelArrayEmpty', Array.isArray(value) && value.length !== 0);
        return value;
      });
    }
  };
});

angular.module('main').directive('modelBiggerThanValidator', function() { 
  return {
    require: 'ngModel',
    scope: {
      validator: '&modelBiggerThanValidator'
    },
    link: function(scope, elem, attr, ngModel) {
      // DOM -> model validation
      ngModel.$parsers.unshift(function(value) {
        var valid = value >= scope.validator();
        ngModel.$setValidity('modelBiggerThan', valid);
        return valid ? value : 0;
      });

      // model -> DOM validation
      ngModel.$formatters.unshift(function(value) {
        ngModel.$setValidity('modelBiggerThan', value >= scope.validator());
        return value;
      });
    }
  };
});

angular.module('main').directive('nameUsedValidator', function() { 
  return {
    require: 'ngModel',
    scope: {
      propertyName: '&nameUsedProperty',
      answerProperties: '&nameUsedValidator'
    },
    link: function(scope, elem, attr, ngModel) {
      // DOM -> model validation
      ngModel.$parsers.unshift(function(value) {
        var valid = !isNameInProperties(value);
        ngModel.$setValidity('nameUsed', valid);
        return valid ? value : 0;
      });

      // model -> DOM validation
      ngModel.$formatters.unshift(function(value) {
        ngModel.$setValidity('nameUsed', !isNameInProperties(value));
        return value;
      });

      function isNameInProperties(name) {
        var propertyName = scope.propertyName() || 'name';
        var properties = scope.answerProperties() || [];
        for (var i = 0; i < properties.length; i++) {
          if (name === properties[propertyName]) return true;
        }
        return false;
      }
    }
  };
});