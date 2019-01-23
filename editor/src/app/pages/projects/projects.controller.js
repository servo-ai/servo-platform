(function () {
  'use strict';

  angular
    .module('app')
    .controller('ProjectsController', ProjectsController);

  ProjectsController.$inject = [
    '$state',
    '$window',
    'dialogService',
    'systemService',
    'notificationService',
    'projectModel'
  ];

  function ProjectsController($state,
    $window,
    dialogService,
    systemService,
    notificationService,
    projectModel) {

    // HEAD //
    var vm = this;
    vm.recentProjects = [];
    vm.isDesktop = null;

    vm.newProject = newProject;
    vm.openProject = openProject;
    vm.editProject = editProject;
    vm.saveProject = saveProject;
    vm.publishProject = publishProject;
    vm.closeProject = closeProject;
    vm.removeProject = removeProject;
    vm.isTemplate = isTemplate;
    vm.nameStyle = nameStyle;
    vm.tooltipText = tooltipText;

    _activate();

    // BODY //
    function _activate() {
      vm.isDesktop = systemService.isDesktop;
      projectModel
        .getRecentProjects()
        .then(function (recents) {
          vm.recentProjects = recents;
        });
    }

    function _newProject(path, name) {
      projectModel
        .newProject(path, name)
        .then(function () {
          $state.go('editor');
          $window.editor.trigger('editorreset');
        });
    }

    function tooltipText(projectName) {
      return isTemplate(projectName) ? 'Edit starter bot template' : 'open ' + projectName;
    }

    function nameStyle(projectName) {
      return isTemplate(projectName) ? {
        "color": "lightblue",
        "font-weight": "bold"
      } : '';
    }

    function isTemplate(projectName) {
      return projectName === projectModel.STARTINGTEMPLATENAME || projectName === "unit-tests";
    }

    function newProject() {
      function doNew() {
        // Get project name
        dialogService
          .prompt('New project', null, 'input', 'Project name')
          .then(function (name) {
            // If no name provided, or invalid name, abort
            var isValid = $window.editor.project.testTreeName(name);
            if (!name || !isValid) {
              notificationService.error(
                'Invalid project name',
                'Must contain only file-name compatible letters'
              );
              return;
            }
            var normalizedName = name;
            // If desktop, open file dialog
            if (vm.isDesktop) {
              var placeholder = name.replace(/\s+/g, "_").toLowerCase();

              dialogService
                .saveAs(placeholder, ['.b3', '.json'])
                .then(function (path) {
                  _newProject(path, name);
                });
            } else {
              var path = "drafts/";
              path += normalizedName.replace(" ", "-") + "/";
              path += normalizedName.replace(" ", "-") + ".json";
              _newProject(path, normalizedName);
            }
          });
      }

      if ($window.editor.isDirty()) {
        dialogService
          .confirm(
            'Leave without saving?',
            'If you proceed you will lose all unsaved modifications.',
            null, {
              closeOnConfirm: false
            })
          .then(doNew);
      } else {
        doNew();
      }
    }

    function _openProject(path, projectName) {
      projectModel
        .openProject(path, projectName)
        .then(function () {
          $state.go('editor');
        }, function () {
          notificationService.error(
            'Invalid file',
            'Couldn\'t open the project file.'
          );
        });
    }

    function openProject(path, projectName) {
      function doOpen() {
        if (path) {
          _openProject(path, projectName);
        } else {
          dialogService
            .openFile(false, ['.b3', '.json'])
            .then(function (path) {
              _openProject(path, projectName);
            });
        }
      }

      if ($window.editor.isDirty()) {
        dialogService
          .confirm(
            'Leave without saving?',
            'If you proceed you will lose all unsaved modifications.')
          .then(doOpen);
      } else {
        doOpen();
      }
    }

    function editProject() {
      var project = projectModel.getProject();

      dialogService
        .prompt('Rename project', null, 'input', project.name)
        .then(function (name) {
          // If no name provided, abort
          if (!name) {
            notificationService.error(
              'Invalid name',
              'You must provide a name for the project.'
            );
            return;
          }

          project.name = name;
          projectModel
            .saveProject(project)
            .then(function () {
              _activate();
              notificationService.success(
                'Project renamed',
                'The project has been renamed successfully.'
              );
            });
        });
    }

    function saveProject() {
      projectModel
        .saveProject()
        .then(function () {
          notificationService.success(
            'Project saved',
            'The project has been saved'
          );
        }, function () {
          notificationService.error(
            'Error',
            'Project couldn\'t be saved'
          );
        });
    }

    function publishProject() {
      projectModel
        .publishProject()
        .then(function () {
          notificationService.success(
            'Project published',
            'The project has been published'
          );
        }, function () {
          notificationService.error(
            'Error',
            'Project couldn\'t be published'
          );
        });
    }

    function closeProject() {
      function doClose() {
        projectModel.closeProject();
      }

      if ($window.editor.isDirty()) {
        dialogService
          .confirm(
            'Leave without saving?',
            'If you proceed you will lose all unsaved modifications.',
            null)
          .then(doClose);
      } else {
        doClose();
      }
    }

    function removeProject(path, name) {
      dialogService.
      confirm(
        'Remove project?',
        'Are you sure you want to remove this project?'
      ).then(function () {
        projectModel
          .removeProject(path, name)
          .then(function () {
            _activate();
            notificationService.success(
              'Project removed',
              'The project has been removed from editor.'
            );
          }, function (err) {
            notificationService.success(
              'Project not removed',
              'Error in removal:' + err
            );
          });
      });
    }
  }
})();