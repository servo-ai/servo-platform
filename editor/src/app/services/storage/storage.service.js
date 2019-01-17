angular
  .module('app')
  .factory('storageService', storageService);

storageService.$inject = ['$q', 'serverStorageService'];

function storageService($q, serverStorageService) {
  var storage = serverStorageService;

  var service = {
    save: save,
    saveAsync: saveAsync,
    publish: publishAsync,
    load: load,
    loadAsync: loadAsync,
    remove: remove,
    removeAsync: removeAsync,
    projects: storage.projects
  };
  return service;

  function save(path, data) {
    storage.save(path, data);
  }
  function saveAsync(path, data) {
    return $q(function (resolve, reject) {
      try {
        storage.save(path, data).then(resolve,reject);
      } catch (e) {
        reject(e);
      }
    });
  }
  function publishAsync(name) {
    return $q(function (resolve, reject) {
      try {
        storage.publish(name).then(resolve,reject);
      } catch (e) {
        reject(e);
      }
    });
  }
  function load(path) {
    return storage.load(path);
  }
  function loadAsync(path) {
    return $q(function (resolve, reject) {
      try {
        var data = storage.load(path);
        resolve(data);
      } catch (e) {
        reject(e);
      }
    });
  }
  function remove(path) {
    storage.remove(path);
  }
  function removeAsync(path) {
    return $q(function (resolve, reject) {
      try {
        storage.remove(path);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }
}