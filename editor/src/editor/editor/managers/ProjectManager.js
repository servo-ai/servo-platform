b3e.editor.ProjectManager = function (editor) {
  "use strict";

  /**
   * Creates a new project.
   */
  this.create = function (projectName) {
    this.close();

    var project = new b3e.project.Project(editor, projectName);
    editor.addChild(project);
    editor._project = project;

    editor._project.trees.add(projectName, true /*root tree*/ );

    editor.trigger('projectcreated', editor._project);
  };

  /*
  Test tree names
        Must not be empty.
        Must not start with .
        Must not be com0- com9, con, lpt0 - lpt9, nul, prn
        Must not contain | * ? \ : < > $ / whitespace
        Must not end with .
        */
  this.testTreeName = function (treeName) {

    var rg = /^(?!\.)(?!com[0-9]$)(?!con$)(?!lpt[0-9]$)(?!nul$)(?!prn$)[^\|\*\?\\:<>/$\s"]*[^\.\|\*\?\\:<>/$\s"]+$/;

    return !!rg.exec(treeName);
  }



  /**
   * Loads a project from data.
   */
  this.open = function (data, projectName) {
    this.close();

    var project = new b3e.project.Project(editor, projectName);
    editor.addChild(project);
    editor._project = project;

    editor.import.projectAsData(data);
    editor.trigger('projectopened', editor._project);
    editor.clearDirty();
  };

  /**
   * Exit the current project.
   */
  this.close = function () {
    var project = editor._project;
    if (project) {
      editor.removeChild(project);
      editor.trigger('projectclosed', project);
    }
  };

  /**
   * Gets the current project. Returns `null` if none.
   */
  this.get = function () {
    return editor._project;
  };


  this._applySettings = function (settings) {
    if (editor._project) {
      editor._project._applySettings(settings);
    }
  };
};
