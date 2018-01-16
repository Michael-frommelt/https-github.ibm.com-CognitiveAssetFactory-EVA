/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var cache = {};

module.exports = function() {
    return {
        get: function(key) {
            return cache[key];
        },
        set: function(key, val) {
            cache[key] = val;
        }
    }
}();
