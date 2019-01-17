angular.module("app").factory("serverStorageService", serverStorageService);

serverStorageService.$inject = ["$http", "$q", "configService", "userService", "notificationService"];

function serverStorageService($http, $q, configService, userService, notificationService) {
  var ok = true;
  configService.getBaseUrl();
  var service = {
    ok: ok,
    save: save,
    publish: publish,
    load: load,
    remove: remove,
    projects: projects
  };
  return service;

  function save(path, data) {
    return $q(function (resolve, reject) {
      if (typeof data !== "string") {
        try {
          data = JSON3.stringify(data);
        } catch (e) {}
      }
      post("/api/b3/save", {
        data: data,
        path: path
      }).then(resolve);
    });
  }

  function publish(name) {
    return $q(function (resolve, reject) {
      if (typeof data !== "string") {
        try {
          data = JSON3.stringify(data);
        } catch (e) {}
      }
      post("/api/b3/publish", {
        name: name
      }).then(resolve).catch(reject);
    });
  }

  function load(path) {
    return $q(function (resolve, reject) {
      get("/api/b3/load", {
        path: path
      }).then(resolve).catch(reject);
    });
  }

  function projects(path) {
    return $q(function (resolve, reject) {
      get("/api/b3/list", {
        path: path
      }).then(resolve).catch(reject);;
    });
  }

  function remove(name) {
    return $q(function (resolve, reject) {
      post("/api/b3/remove", {
        name: name
      }).then(resolve).catch(reject);
    });
  }

  function get(url, obj) {
    return ajax(url, obj, "GET");
  }

  function post(url, obj) {
    return ajax(url, obj, "POST");
  }

  function ajax(url, obj, method) {
    var req = {
      method: method
    };
    if (method == "GET") {
      req.params = obj;
    } else if (method == "POST") {
      req.data = obj;
    }

    return $q(function (resolve, reject) {
      userService.getProfile(true).then(function (user) {
        configService.getBaseUrl().then(function (baseUrl) {
          if (user.loggedIn) {
            req.headers = {
              SessionID: user.sessionID
            };
          }
          req.url = baseUrl + url;
          $http(req)
            .then(function successCallback(response) {
              resolve(response.data);
            }, function (error) {
              console.error("error in Server Storage service", error);
              var msg = error.message || error.statusText;
              notificationService.error('Server Storage, url/params=' + url + JSON.stringify(obj), msg ? msg : "Is server online?");
              reject(error);
            });
        });
      });
    });
  }
}
