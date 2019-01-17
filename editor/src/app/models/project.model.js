(function () {
  'use strict';

  function onLoggerMessage(logObject) {
    logObject = JSON.stringify(logObject);
    if (logObject.logtype === 'info') {
      console.info.apply(logObject.logData)
    } else if (logObject.logtype === 'error') {
      console.error.apply(logObject.logData)
    } else {
      console.log.apply(logObject.logData)
    }
  }

  function onLoggerClose() {
    console.log('close logger')
  }

  function onLoggerOpen() {
    console.log('open logger')
  }

  angular
    .module('app')
    .factory('projectModel', projectModel);

  projectModel.$inject = [
    '$q',
    '$rootScope',
    '$window',
    'storageService',
    'systemService',
    'localStorageService',
    'editorService',
    'debugCommService'
  ];

  function projectModel($q,
    $rootScope,
    $window,
    storageService,
    systemService,
    localStorageService,
    editorService,
    debugCommService) {


    // HEAD //
    var recentPath = systemService.join(systemService.getDataPath(), 'recents.json');
    var recentCache = null;
    var currentProject = null;
    var templateIndex = -1;
    var startingTemplate;
    const STARTINGTEMPLATENAME = "starting-template";
    var service = {
      getRecentProjects: getRecentProjects,
      newProject: newProject,
      getProject: getProject,
      saveProject: saveProject,
      openProject: openProject,
      closeProject: closeProject,
      removeProject: removeProject,
      publishProject: publishProject,
      STARTINGTEMPLATENAME: STARTINGTEMPLATENAME
    };
    return service;

    // BODY //
    function _saveRecentProjects() {
      //storageService.save(recentPath, recentCache);
    }

    function _updateRecentProjects(project) {
      if (project) {
        for (var i = recentCache.length - 1; i >= 0; i--) {
          if (recentCache[i].path === project.path) {
            recentCache.splice(i, 1);
          } else {
            recentCache[i].isOpen = false;
          }
        }

        var data = project;
        data.isOpen = true;

        recentCache.splice(0, 0, data);
      } else {
        for (var j = 0; j < recentCache.length; j++) {
          recentCache[j].isOpen = false;
        }
      }
      _saveRecentProjects();
    }

    function _setProject(project) {
      // Set current open project to the localStorage, so the app can open it
      //   during intialization
      currentProject = project;
      _updateRecentProjects(project);
      $rootScope.$broadcast('dash-projectchanged');

    }

    function getRecentProjects() {
      return $q(function (resolve, reject) {
        if (recentCache) {
          return resolve(recentCache);
        } else {
          storageService.projects().then(function (trees) {
            recentCache = [];
            b3.trees = [];
            for (var key in trees) {
              var tree = trees[key];

              if (tree.trees) {
                for (var key2 in tree.trees) {
                  var tree2 = tree.trees[key2];
                  if (typeof tree2 != "function") b3.trees.push(tree2);
                }
              }
              //b3.trees.push(tree);
              recentCache.push(treeToProject(tree));
              // if its a starting template, dont show it as a project
              if (key.indexOf(STARTINGTEMPLATENAME) >= 0) {
                startingTemplate = treeToProject(tree);
                templateIndex = recentCache.length - 1;
              }
            }
            return resolve(recentCache);
          });
        }
      });
    }


    function newProject(path, name) {
      function rootTemplateData() {
        return startingTemplate.data.trees.find(function (tree) {
          return tree.name === STARTINGTEMPLATENAME;
        })
      }
      return $q(function (resolve, reject) {
        var project = {
          id: convertToID(name),
          name: name,
          description: '',
          data: [],
          path: path,
          lastSaved: new Date(),
          lastPublished: new Date(),
          state: "draft",
          properties: []
        };

        editorService.newProject(name);
        project.data = editorService.exportProject();

        var rootTemplate = rootTemplateData();
        angular.extend(project.data.trees[0], rootTemplate);
        project.data.trees[0].id = convertToID(name);
        project.data.trees[0].name = name;
        project.data.trees[0].title = name;
        for (var i = 0; i < startingTemplate.data.trees.length; i++) {
          if (startingTemplate.data.trees[i].name !== STARTINGTEMPLATENAME) {
            project.data.trees.push({});
            angular.copy(startingTemplate.data.trees[i], project.data.trees[project.data.trees.length - 1]);
          }
        }
        var i = $window.editor.import;
        try {
          i.projectAsData(project.data);
        } catch (e) {
          notificationService.error(
            'Invalid template data',
            'A starting-template tree is invalid: ' + e.message
          );
        }
        saveProject(project)
          .then(function () {
            _setProject(project);
            resolve();
          }, function (err) {
            reject(err);
          });
      });
    }

    function getProject() {
      return currentProject;
    }

    function saveProject(project, toPublish) {
      project = project || currentProject;
      project.data = editorService.exportProject();
      project.lastSaved = new Date();
      project.state = 'draft';
      if (toPublish) {
        project.lastPublished = new Date();
        project.state = 'published';
      }

      return $q(function (resolve, reject) {
        $window.editor.clearDirty();
        _updateRecentProjects(project);
        storageService.saveAsync(project.path, project).then(function () {
          resolve();
        }, function (err) {
          reject(err);
        });
      });
    }

    function publishProject(keepConnect) {
      var project = currentProject;

      return $q(function (resolve, reject) {
        $window.editor.clearDirty();
        if (!keepConnect) {
          debugCommService.disconnect();
        }
        saveProject(project, true).then(function () {
          storageService.publish(project.name).then(function () {
            _updateRecentProjects(project);
            resolve();
          }, function (err) {
            reject(err);
          });

        }, function (err) {
          reject(err);
        });
      });
    }

    function openProject(path, projectName) {
      return $q(function (resolve, reject) {
        for (var key in recentCache) {
          var project = recentCache[key];
          if (project.path != path) continue;
          editorService.openProject(project.data, path, projectName);
          debugCommService.disconnect();
          _setProject(project);
          resolve();
          return;
        }
        reject(key + " tree not found");
      });
    }

    function closeProject() {
      return $q(function (resolve, reject) {
        $window.editor.clearDirty();
        editorService.closeProject();
        debugCommService.disconnect();
        _setProject(null);
        resolve();
      });
    }

    function removeProject(path, name) {
      return $q(function (resolve, reject) {
        for (var i = 0; i < recentCache.length; i++) {
          if (recentCache[i].path === path) {
            recentCache.splice(i, 1);
            break;
          }
        }

        storageService.remove(name);

        _saveRecentProjects();
        resolve();
      });
    }

    function treeToProject(tree) {
      var project = {
        id: tree.id || convertToID(tree.name),
        name: tree.name,
        description: tree.description,
        path: tree.path,
        lastSaved: tree.lastSaved || new Date(),
        lastPublished: tree.lastPublished || new Date(),
        state: tree.state || 'draft',
        data: {
          version: tree.version,
          trees: [],
          custom_nodes: []
        }
      };
      for (var i = 0; i < tree.trees.length; i++) {
        var tree2 = tree.trees[i];
        project.data.trees.push(tree2);
      }
      return project;
    }

    function convertToID(name) {
      return name.replace(" ", "-");
    }
  }
})();
