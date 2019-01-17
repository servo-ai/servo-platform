(function() {
  'use strict';

  angular
    .module('app')
    .factory('settingsModel', settingsModel);

  settingsModel.$inject = [
    '$q',
    'storageService',
    'systemService',
    'editorService'
  ];

  function settingsModel($q,
                           storageService, 
                           systemService,
                           editorService) {

    // HEADER //
    var settingsPath = 'settings.json';
    var settingsCache = null;

    var service = {
      getSettings   : getSettings,
      saveSettings  : saveSettings,
      resetSettings : resetSettings,
    };
    return service;

    // BODY //
    function getSettings() {
      return $q(function(resolve, reject) {
        if (!settingsCache) {
          var defaultData = editorService.getDefaultSettings();
          storageService.load(settingsPath).then(function(data){
            editorService.applySettings(data);
            settingsCache = tine.merge({}, defaultData, data);
            resolve(settingsCache);
          }, function(err) {
            // Create if storage file does not exist
            data = defaultData;
            storageService.save(settingsPath, data);
            settingsCache = defaultData;
            resolve(settingsCache);
          });
        } else {
          resolve(settingsCache);
        }
      });
    }
    function saveSettings(settings) {
      return $q(function(resolve, reject) {
        editorService.applySettings(settings);
        storageService.save(settingsPath, settings);
        settingsCache = settings;
        resolve();
      });
    }
    function resetSettings() {
      return $q(function(resolve, reject) {
        var settings = editorService.getDefaultSettings();
        storageService.save(settingsPath, settings);
        settingsCache = settings;
        editorService.applySettings(settings);
        resolve();
      });
    }
  }
})();