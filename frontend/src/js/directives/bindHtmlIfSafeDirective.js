/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main').directive("bindHtmlIfSafe", ['$compile', '$parse', '$sce', function ($compile, $parse, $sce) {
  return {
    restrict: 'A',
    compile: function bindHtmlIfSafeCompile(tElement, tAttrs) {
      var bindHtmlGetter = $parse(tAttrs.bindHtmlIfSafe);
      var bindHtmlWatch = $parse(tAttrs.bindHtmlIfSafe, function(value) {
        return $sce.valueOf(value);
      });
      
      return function bindHtmlIfSafeLink(scope, element, attr) {
        scope.$watch(bindHtmlWatch, function() {
          // The watched value is the unwrapped value. To avoid re-escaping, use the direct getter.
          var html = bindHtmlGetter(scope);
          var sanitizedHtml;
          try {
            sanitizedHtml = $sce.getTrustedHtml(html);
          } catch (ex) {}

          if (sanitizedHtml != null) {
            element.html(sanitizedHtml);
          } else {
            element.text(html);
          }
        });
      };
    }
  };
}]);