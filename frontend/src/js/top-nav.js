/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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
