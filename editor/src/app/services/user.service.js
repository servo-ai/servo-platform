angular.module("app").factory("userService", userService);

userService.$inject = ["$rootScope", "$window", "$http", "$q", "configService", "notificationService"];

var _profile = null;

function userService($rootScope, $window, $http, $q, configService, notificationService) {
  configService.getBaseUrl();

  $window.fbAsyncInit = function () {
    initFacebook();
  };
  initFacebook();

  return {
    getProfile: getProfile,
    getStatus: getStatus,
    login: login,
    user: profile,
    anonymousLogin: anonymousLogin
  };

  function profile() {
    return _profile;
  }

  function initFacebook() {
    if (FB) {
      FB.init({
        appId: "848238748692034",
        status: true,
        cookie: true,
        xfbml: true,
        version: "v2.9"
      });
    }

  }

  function getStatus() {
    return $q(function (resolve, reject) {
      //  if debugging on localhost, dont login on FB
      configService.getParams().then(function (params) {
        resolve(userModel("anonymous", "anonymous@servo.ai", "anonymous"));
        // dont deal with FB login now
        // if (configService.isLocalHost(params.serverBaseDomain)) {
        //   return resolve(userModel());
        // } else {
        //   var x = FB.getLoginStatus(function (response) {
        //     if (response.status === "connected") {
        //       // the user is logged in and has authenticated your
        //       // app, and response.authResponse supplies
        //       // the user's ID, a valid access token, a signed
        //       // request, and the time the access token
        //       // and signed request each expire
        //       var uid = response.authResponse.userID;
        //       var accessToken = response.authResponse.accessToken;
        //       getProfile().then(function (profile) {
        //         var user = userModel(profile.name, profile.email, uid);
        //         _profile = user;
        //         servoAuth(user).then(function () {
        //           resolve(user);
        //         });
        //       });
        //     } else if (response.status === "not_authorized") {
        //       console.error('not login: check config.json')
        //       // the user is logged in to Facebook,
        //       // but has not authenticated your app
        //       resolve(userModel());
        //     } else {
        //       console.error('not login: check config.json')
        //       // the user isn't logged in to Facebook.
        //       resolve(userModel());
        //     }
        //   });
        //   console.log(x)
        // }

      })

    });
  }

  function login() {
    return $q(function (resolve, reject) {
      FB.login(
        function (response) {
          if (response.status === "connected") {
            // the user is logged in and has authenticated your
            // app, and response.authResponse supplies
            // the user's ID, a valid access token, a signed
            // request, and the time the access token
            // and signed request each expire
            var uid = response.authResponse.userID;
            var accessToken = response.authResponse.accessToken;
            getProfile().then(function (profile) {
              var user = userModel(profile.name, profile.email, uid);
              _profile = user;
              servoAuth(user).then(function () {
                resolve(user);
              });
            });
          } else if (response.status === "not_authorized") {
            // the user is logged in to Facebook,
            // but has not authenticated your app
            resolve(userModel());
          } else {
            // the user isn't logged in to Facebook.
            resolve(userModel());
          }
        }, {
          scope: "public_profile,email"
        }
      );
    });
  }

  function anonymousLogin() {
    return servoAuth(userModel("anonymous", "anonymous@servo.ai", "anonymous"));
  }

  function getProfile(dontReqFB) {
    return $q(function (resolve, reject) {
      if (_profile || dontReqFB) {
        return resolve(_profile || userModel("anonymous", "anonymous@servo.ai", "anonymous"));
      }
      FB.api("/me", {
        fields: "email,name,last_name,first_name"
      }, function (response) {
        if (response.error) reject(response.error);
        else resolve(response);
      });
    });
  }

  function userModel(name, email, facebookID, githubID) {
    return {
      loggedIn: facebookID || githubID ? true : false,
      name: name,
      email: email,
      facebookID: facebookID,
      githubID: githubID
    };
  }

  function servoAuth(user) {
    return $q(function (resolve, reject) {
      post("/api/login", user).then(function (user) {

        _profile = user;
        _profile.loggedIn = true;

        $rootScope.$broadcast('user-logged-in');
        resolve(user);
      });
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
      configService.getBaseUrl().then(function (baseUrl) {
        req.url = baseUrl + url;
        $http(req)
          .success(resolve)
          .error(function (error) {
            console.error("error in saving ", error);
            notificationService.error(req.method + ' error', (error && JSON.stringify(error)) || "Is server online?");
            reject(error);
          });
      });
    });
  }
}