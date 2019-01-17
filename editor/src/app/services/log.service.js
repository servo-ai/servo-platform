angular
  .module('app')
  .factory('logService', logService);

logService.$inject = ['$http', '$q', 'configService', 'debugCommService'];

function logService($http, $q, configService, debugCommService) {
  var service = {
    list: list,
    file: file
  };

  return service;

  function list() {
    return $q(function (resolve, reject) {
      configService.getBaseUrl().then(function (baseUrl) {
        $http({
          method: 'GET',
          url: baseUrl + '/api/log/list'
        }).
        success(function (files) {
          resolve(files);
        }).error(function (err) {
          reject(err);
        });
      });
    });
  }

  function file(name) {
    return $q(function (resolve, reject) {
      configService.getBaseUrl().then(function (baseUrl) {
        $http({
          method: 'GET',
          url: baseUrl + '/api/log/file',
          params: {
            name: name
          }
        }).success(function (rows) {
          resolve(rows);
        }).error(function (err) {
          reject(err);
        });
      });
    });
  }
}
