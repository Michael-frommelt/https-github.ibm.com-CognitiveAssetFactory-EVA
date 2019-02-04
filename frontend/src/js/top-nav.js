/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

var utils = utils || {},
  components = components || {};

(function() {
  document.addEventListener('DOMContentLoaded', function() {
    return new components.Menu(function() {
      var config = {
        $menu: document.getElementById('top-nav')
      };

      return config;
    });
  });
}());
