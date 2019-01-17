(function () {
  'use strict';
  angular
    .module('app')
    .factory('configService', configService);

  configService.$inject = ['$http', '$q'];

  var _params = null;

  function configService($http, $q) {

    return {
      getParams: getParams,
      getBaseUrl: getBaseUrl,
      isLocalHost: isLocalHost
    };

    function isLocalHost(baseUrl) {
      return baseUrl && (baseUrl.toLowerCase().indexOf('localhost') >= 0 || baseUrl.toLowerCase().indexOf('127.0.0.0') >= 0);
    }

    function getParams() {
      return $q(function (resolve, reject) {
        if (_params == null) {
          load().then(function (config) {
            _params = config;
            resolve(_params);
          }).catch(function (err) {
            console.log("Error loading config file.", err);
            reject(err);
          });
        } else {
          resolve(_params);
        }
      });
    }

    function getBaseUrl(noProtocol, noPortOnNonLocal) {
      return $q(function (resolve, reject) {
        getParams().then(function (params) {
          var url = "";
          if (!noProtocol) {
            url += "http";
            if (params.openSSL) {
              url += "s";
            }
            url += "://";
          }
          url += params.serverBaseDomain;
          if (!noPortOnNonLocal || isLocalHost(params.serverBaseDomain)) {
            url += ":";
            url += params.port;
          }
          url += params.basePath || "";
          resolve(url);
        });
      });
    }

    function load() {
      return $q(function (resolve, reject) {
        $http({
          method: 'GET',
          url: '/config.json'
        }).
        success(function (content) {
          resolve(content);
        }).
        error(function (err) {
          reject(err);
        });
      });
    }
  }
})();
