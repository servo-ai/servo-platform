// get ag-Grid to create an Angular module and register the ag-Grid directive
agGrid.initialiseAgGridWithAngular1(angular);

angular.module('app', [
    'ui.router',
    'ui.bootstrap',
    'ngAnimate',
    'templates',
    'ng.jsoneditor',
    'agGrid',
    'ngChatbox'
  ])

  .run(['$rootScope', '$window', '$state',
    function Execute($rootScope, $window, $state) {
      $rootScope.isDesktop = !!$window.process && !!$window.require;
      $rootScope.user = {
        loggedIn: false
      };
      $rootScope.go = function (state, params) {
        $state.go(state, params);
      };
    }
  ])

  .run(['$rootScope', '$window', '$animate', '$location', '$document', '$timeout', 'settingsModel', 'projectModel', 'userService',
    function Execute($rootScope,
      $window,
      $animate,
      $location,
      $document,
      $timeout,
      settingsModel,
      projectModel,
      userService) {

      // reset path
      $location.path('/');

      // add drop to canvas
      angular
        .element($window.editor._game.canvas)
        .attr('b3-drop-node', true);

      function closePreload() {
        $timeout(function () {
          var element = angular.element(document.getElementById('page-preload'));
          $animate.addClass(element, 'preload-fade')
            .then(function () {
              element.remove();
            });
        }, 500);
      }

      function getProjects() {
        settingsModel.getSettings();
        projectModel
          .getRecentProjects()
          .then(function (projects) {
            if (projects.length > 0 && projects[0].isOpen) {
              projectModel
                .openProject(projects[0].path)
                .then(function () {
                  closePreload();
                }).catch(function (ex) {
                  console.error('openProject failed:', ex);
                });
            } else {
              closePreload();
            }
          });
      }
      $rootScope.$on('user-logged-in', function () {
        getProjects();
      });
      // initialize editor
      userService.getStatus().then(function (userObj) {
        $rootScope.user = userObj;
        if (!userObj.isLoggedIn) {
          closePreload();
          return;
        }
      });
    }
  ]);
